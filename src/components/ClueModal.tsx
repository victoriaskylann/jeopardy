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
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-blue-800 p-8 text-white">
        <div className="mb-4 text-center text-sm uppercase tracking-widest text-amber-300">
          {category} — ${clue.value}
        </div>
        <p className="mb-8 text-center text-3xl font-semibold leading-tight">
          {clue.clue}
        </p>
        {showAnswer && (
          <p className="mb-6 rounded bg-blue-950 p-3 text-center text-lg text-amber-200">
            Answer: {clue.answer}
          </p>
        )}
        <div className="flex flex-col items-center gap-3">
          <BuzzerControls state={state} me={me} send={send} />
        </div>
      </div>
    </div>
  );
}
