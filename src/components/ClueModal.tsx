import { useState } from 'react';
import type { ClientEvent, RoomState } from '../types';
import type { Me } from '../hooks/useGameState';
import { BuzzerControls } from './BuzzerControls';

type Props = {
  state: RoomState;
  me: Me;
  send: (event: ClientEvent) => void;
};

const pillBase =
  'rounded-full px-6 py-3 font-semibold shadow-sm transition disabled:opacity-40';

export function ClueModal({ state, me, send }: Props) {
  // Once revealed, stays revealed for the rest of this clue. The modal
  // unmounts when phase returns to selectingClue, resetting this for the
  // next clue.
  const [hasRevealedAnswer, setHasRevealedAnswer] = useState(false);

  if (!state.selectedClue || !state.game) return null;
  const { categoryIdx, clueIdx } = state.selectedClue;
  const clue = state.game.jeopardyRound.categories[categoryIdx].clues[clueIdx];
  const category = state.game.jeopardyRound.categories[categoryIdx].name;

  const inJudging = state.phase === 'judging';
  const needsReveal = me.isHost && inJudging && !hasRevealedAnswer;
  const showAnswer = me.isHost && inJudging && hasRevealedAnswer;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-teal-dark/70 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-y-auto rounded-2xl bg-teal p-5 text-cream-light shadow-2xl sm:rounded-3xl sm:p-10">
        <div className="mb-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.25em] text-mustard sm:mb-6 sm:gap-3 sm:text-xs sm:tracking-[0.3em]">
          <span>{category}</span>
          <span className="text-cream-light/40">•</span>
          <span>${clue.value}</span>
        </div>
        <p className="mb-6 text-center font-display text-xl font-medium leading-snug text-cream-light sm:mb-10 sm:text-3xl">
          {clue.clue}
        </p>
        {showAnswer && (
          <p className="mb-6 rounded-2xl bg-teal-dark px-4 py-3 text-center text-mustard sm:mb-8 sm:px-5 sm:py-4">
            <span className="text-[10px] uppercase tracking-[0.25em] text-mustard/70 sm:text-xs sm:tracking-[0.3em]">
              answer
            </span>
            <br />
            <span className="font-display text-lg sm:text-2xl">{clue.answer}</span>
          </p>
        )}
        <div className="flex flex-col items-center gap-3">
          {needsReveal ? (
            <button
              className={`${pillBase} bg-mustard text-cream-light hover:bg-mustard-dark`}
              onClick={() => setHasRevealedAnswer(true)}
            >
              Reveal Answer
            </button>
          ) : (
            <BuzzerControls state={state} me={me} send={send} />
          )}
        </div>
      </div>
    </div>
  );
}
