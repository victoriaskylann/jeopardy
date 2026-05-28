import { useState } from 'react';
import type { ClientEvent, RoomState } from '../types';
import type { Me } from '../hooks/useGameState';

type Props = {
  state: RoomState;
  me: Me;
  send: (event: ClientEvent) => void;
};

export function FinalJeopardy({ state, me, send }: Props) {
  if (!state.game) return null;
  const fj = state.game.finalJeopardy;
  const myScore = state.scores[me.playerId] ?? 0;
  const eligible = myScore > 0;

  if (state.phase === 'roundComplete') {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 p-8 text-center">
        <h2 className="text-3xl font-bold">Round complete!</h2>
        <p>Ready for Final Jeopardy?</p>
        {me.isHost && (
          <button
            className="rounded-lg bg-amber-500 px-6 py-3 font-bold text-white"
            onClick={() => send({ type: 'revealFinalCategory' })}
          >
            Reveal Final Category
          </button>
        )}
      </div>
    );
  }

  if (state.phase === 'finalCategoryShown') {
    return <WagerStage state={state} me={me} send={send} category={fj.category} eligible={eligible} myScore={myScore} />;
  }

  if (state.phase === 'finalClueShown') {
    return <AnswerStage state={state} me={me} send={send} clue={fj.clue} eligible={eligible} />;
  }

  if (state.phase === 'finalReveal') {
    return <RevealStage state={state} me={me} send={send} fj={fj} />;
  }

  return null;
}

function WagerStage({
  state, me, send, category, eligible, myScore,
}: Props & { category: string; eligible: boolean; myScore: number }) {
  const [wager, setWager] = useState(0);
  const submitted = state.finalJeopardy?.wagers[me.playerId] !== undefined;
  const wageredCount = Object.keys(state.finalJeopardy?.wagers ?? {}).length;
  const eligibleCount = state.players.filter((p) => (state.scores[p.id] ?? 0) > 0).length;

  return (
    <div className="mx-auto max-w-2xl p-8 text-center">
      <p className="mb-2 text-sm uppercase tracking-widest text-slate-500">Final Jeopardy</p>
      <h2 className="mb-8 text-3xl font-bold">{category}</h2>

      {eligible ? (
        submitted ? (
          <p className="text-lg">Wager locked in. Waiting for others… ({wageredCount}/{eligibleCount})</p>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <label className="text-sm">Your score: ${myScore}</label>
            <input
              type="number"
              min={0}
              max={myScore}
              className="w-48 rounded-lg border px-3 py-2 text-2xl"
              value={wager}
              onChange={(e) => setWager(Number(e.target.value))}
            />
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
              disabled={wager < 0 || wager > myScore}
              onClick={() => send({ type: 'submitFinalWager', wager })}
            >
              Lock in wager
            </button>
          </div>
        )
      ) : (
        <p className="text-slate-500">You are not eligible for Final Jeopardy (score ≤ 0).</p>
      )}

      {me.isHost && (
        <button
          className="mt-8 rounded-lg bg-amber-500 px-6 py-3 font-bold text-white disabled:opacity-50"
          disabled={wageredCount < eligibleCount}
          onClick={() => send({ type: 'revealFinalClue' })}
        >
          Reveal Final Clue
        </button>
      )}
    </div>
  );
}

function AnswerStage({
  state, me, send, clue, eligible,
}: Props & { clue: string; eligible: boolean }) {
  const [answer, setAnswer] = useState('');
  const submitted = state.finalJeopardy?.submitted.includes(me.playerId) ?? false;

  return (
    <div className="mx-auto max-w-2xl p-8 text-center">
      <p className="mb-2 text-sm uppercase tracking-widest text-slate-500">Final Jeopardy</p>
      <p className="mb-6 text-2xl font-semibold">{clue}</p>

      {eligible ? (
        submitted ? (
          <p>Answer submitted. Waiting for host.</p>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <input
              className="w-full rounded-lg border px-3 py-2 text-lg"
              placeholder="What is…"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white"
              onClick={() => send({ type: 'submitFinalAnswer', answer })}
            >
              Submit answer
            </button>
          </div>
        )
      ) : (
        <p className="text-slate-500">Spectating.</p>
      )}
    </div>
  );
}

function RevealStage({
  state, me, send, fj,
}: Props & { fj: { category: string; clue: string; answer: string } }) {
  const fjState = state.finalJeopardy!;
  const eligibleIds = state.players
    .filter((p) => (state.scores[p.id] ?? 0) > 0 || fjState.revealed.includes(p.id))
    .map((p) => p.id);
  const nextToReveal = eligibleIds.find((id) => !fjState.revealed.includes(id));

  return (
    <div className="mx-auto max-w-2xl p-8">
      <p className="mb-2 text-center text-sm uppercase tracking-widest text-slate-500">Final Jeopardy</p>
      <p className="mb-6 text-center text-2xl font-semibold">{fj.clue}</p>
      <p className="mb-8 text-center text-amber-700">Correct answer: <b>{fj.answer}</b></p>

      {nextToReveal ? (
        <div className="rounded-lg border bg-slate-50 p-6 text-center">
          <p className="mb-3 text-lg font-medium">{state.players.find((p) => p.id === nextToReveal)?.nickname}</p>
          <p className="mb-2">Wager: <b>${fjState.wagers[nextToReveal] ?? 0}</b></p>
          <p className="mb-4 text-2xl">"{fjState.answers[nextToReveal] || '—'}"</p>
          {me.isHost && (
            <div className="flex justify-center gap-3">
              <button
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white"
                onClick={() => send({ type: 'revealFinalPlayer', playerId: nextToReveal, correct: true })}
              >
                Correct
              </button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white"
                onClick={() => send({ type: 'revealFinalPlayer', playerId: nextToReveal, correct: false })}
              >
                Wrong
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center">All players revealed.</p>
      )}
    </div>
  );
}
