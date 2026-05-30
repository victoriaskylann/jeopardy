import { useState } from 'react';
import type { ClientEvent, RoomState } from '../types';
import type { Me } from '../hooks/useGameState';

type Props = {
  state: RoomState;
  me: Me;
  send: (event: ClientEvent) => void;
};

const eyebrow = 'text-xs uppercase tracking-[0.3em] text-mustard';
const pill =
  'rounded-full px-6 py-3 font-semibold shadow-sm transition disabled:opacity-40';

export function FinalJeopardy({ state, me, send }: Props) {
  if (!state.game) return null;
  const fj = state.game.finalJeopardy;
  const myScore = state.scores[me.playerId] ?? 0;
  const eligible = myScore > 0;

  if (state.phase === 'roundComplete') {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 p-6 text-center sm:p-12">
        <p className={eyebrow}>round complete</p>
        <h2 className="font-display text-3xl font-semibold text-teal sm:text-5xl">
          On to Final Jeopardy
        </h2>
        {me.isHost && (
          <button
            className={`${pill} mt-4 bg-mustard text-cream-light hover:bg-mustard-dark`}
            onClick={() => send({ type: 'revealFinalCategory' })}
          >
            Reveal Final Category
          </button>
        )}
      </div>
    );
  }

  if (state.phase === 'finalCategoryShown') {
    return (
      <WagerStage
        state={state}
        me={me}
        send={send}
        category={fj.category}
        eligible={eligible}
        myScore={myScore}
      />
    );
  }

  if (state.phase === 'finalClueShown') {
    return (
      <AnswerStage state={state} me={me} send={send} clue={fj.clue} eligible={eligible} />
    );
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
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 p-5 text-center sm:gap-8 sm:p-10">
      <div>
        <p className={eyebrow}>Final Jeopardy</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-teal sm:text-5xl">
          {category}
        </h2>
      </div>

      {eligible ? (
        submitted ? (
          <p className="rounded-2xl bg-cream-light px-6 py-3 text-teal">
            Wager locked in. Waiting for others…{' '}
            <span className="font-display text-mustard">
              ({wageredCount}/{eligibleCount})
            </span>
          </p>
        ) : (
          <div className="flex w-full max-w-sm flex-col items-center gap-3">
            <label className="text-sm text-teal/70">
              Your score: <span className="font-display text-teal">${myScore}</span>
            </label>
            <input
              type="number"
              min={0}
              max={myScore}
              className="w-48 rounded-2xl border-2 border-teal/30 bg-cream-light px-4 py-3 text-center font-display text-3xl text-teal focus:border-teal focus:outline-none"
              value={wager}
              onChange={(e) => setWager(Number(e.target.value))}
            />
            <button
              className={`${pill} bg-teal text-cream-light hover:bg-teal-dark`}
              disabled={wager < 0 || wager > myScore || !Number.isFinite(wager)}
              onClick={() => send({ type: 'submitFinalWager', wager })}
            >
              Lock in wager
            </button>
          </div>
        )
      ) : (
        <p className="rounded-2xl bg-lavender-light px-6 py-3 text-teal/70">
          You're not eligible for Final Jeopardy (score ≤ 0).
        </p>
      )}

      {me.isHost && (
        <button
          className={`${pill} bg-mustard text-cream-light hover:bg-mustard-dark`}
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
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 p-5 text-center sm:gap-8 sm:p-10">
      <p className={eyebrow}>Final Jeopardy</p>
      <p className="font-display text-2xl font-medium leading-snug text-teal sm:text-3xl">
        {clue}
      </p>

      {eligible ? (
        submitted ? (
          <p className="rounded-2xl bg-cream-light px-6 py-3 text-teal">
            Answer submitted. Waiting for host…
          </p>
        ) : (
          <form
            className="flex w-full max-w-md flex-col items-center gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              send({ type: 'submitFinalAnswer', answer });
            }}
          >
            <input
              className="w-full rounded-full border-2 border-teal/30 bg-cream-light px-5 py-3 text-lg text-teal focus:border-teal focus:outline-none"
              placeholder="What is…"
              autoFocus
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <button
              type="submit"
              className={`${pill} bg-teal text-cream-light hover:bg-teal-dark`}
            >
              Submit answer
            </button>
          </form>
        )
      ) : (
        <p className="rounded-2xl bg-lavender-light px-6 py-3 text-teal/70">
          Spectating.
        </p>
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
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 p-5 text-center sm:p-10">
      <p className={eyebrow}>Final Jeopardy</p>
      <p className="font-display text-xl font-medium text-teal sm:text-2xl">{fj.clue}</p>
      <p className="rounded-2xl bg-peach px-6 py-3 text-teal">
        Correct answer:{' '}
        <span className="font-display text-xl text-mustard-dark">{fj.answer}</span>
      </p>

      {nextToReveal ? (
        <div className="w-full rounded-3xl bg-cream-light p-6 sm:p-8">
          <p className="mb-4 font-display text-2xl font-semibold text-teal">
            {state.players.find((p) => p.id === nextToReveal)?.nickname}
          </p>
          <p className="mb-1 text-xs uppercase tracking-[0.3em] text-mustard">
            wager
          </p>
          <p className="mb-4 font-display text-3xl text-teal">
            ${fjState.wagers[nextToReveal] ?? 0}
          </p>
          <p className="mb-1 text-xs uppercase tracking-[0.3em] text-mustard">
            their answer
          </p>
          <p className="mb-6 font-display text-2xl text-teal-dark">
            "{fjState.answers[nextToReveal] || '—'}"
          </p>
          {me.isHost && (
            <div className="flex justify-center gap-3">
              <button
                className={`${pill} bg-teal text-cream-light hover:bg-teal-dark`}
                onClick={() => send({ type: 'revealFinalPlayer', playerId: nextToReveal, correct: true })}
              >
                Correct
              </button>
              <button
                className={`${pill} bg-terracotta text-cream-light hover:bg-terracotta-dark`}
                onClick={() => send({ type: 'revealFinalPlayer', playerId: nextToReveal, correct: false })}
              >
                Wrong
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-teal/70">All players revealed.</p>
      )}
    </div>
  );
}
