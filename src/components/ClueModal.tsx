import type { ClientEvent, RoomState } from '../types';
import type { Me } from '../hooks/useGameState';
import { BuzzerControls } from './BuzzerControls';

type Props = {
  state: RoomState;
  me: Me;
  send: (event: ClientEvent) => void;
};

export function ClueModal({ state, me, send }: Props) {
  if (!state.selectedClue || !state.game) return null;
  const { categoryIdx, clueIdx } = state.selectedClue;
  const clue = state.game.jeopardyRound.categories[categoryIdx].clues[clueIdx];
  const category = state.game.jeopardyRound.categories[categoryIdx].name;

  const showAnswer = me.isHost && state.phase !== 'buzzerOpen';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-teal-dark/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl bg-teal p-10 text-cream-light shadow-2xl">
        <div className="mb-6 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.3em] text-mustard">
          <span>{category}</span>
          <span className="text-cream-light/40">•</span>
          <span>${clue.value}</span>
        </div>
        <p className="mb-10 text-center font-display text-3xl font-medium leading-snug text-cream-light">
          {clue.clue}
        </p>
        {showAnswer && (
          <p className="mb-8 rounded-2xl bg-teal-dark px-5 py-4 text-center text-lg text-mustard">
            <span className="text-xs uppercase tracking-[0.3em] text-mustard/70">
              answer
            </span>
            <br />
            <span className="font-display text-2xl">{clue.answer}</span>
          </p>
        )}
        <div className="flex flex-col items-center gap-3">
          <BuzzerControls state={state} me={me} send={send} />
        </div>
      </div>
    </div>
  );
}
