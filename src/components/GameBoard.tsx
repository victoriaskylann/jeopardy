import type { ClientEvent, RoomState } from '../types';
import type { Me } from '../hooks/useGameState';
import { ClueCell } from './ClueCell';

type Props = {
  state: RoomState;
  me: Me;
  send: (event: ClientEvent) => void;
};

export function GameBoard({ state, me, send }: Props) {
  if (!state.game || !state.board) return null;
  const isPicker = state.pickerId === me.playerId;

  return (
    <div className="grid grid-cols-6 gap-2 p-4">
      {state.game.jeopardyRound.categories.map((cat, catIdx) => (
        <div key={catIdx} className="flex h-24 items-center justify-center rounded-md bg-blue-900 p-2 text-center text-sm font-semibold uppercase text-white">
          {cat.name}
        </div>
      ))}
      {Array.from({ length: 5 }).map((_, clueIdx) => (
        state.game!.jeopardyRound.categories.map((cat, catIdx) => (
          <ClueCell
            key={`${catIdx}-${clueIdx}`}
            value={cat.clues[clueIdx].value}
            revealed={state.board!.revealed[catIdx][clueIdx]}
            isPicker={isPicker}
            onClick={() => send({ type: 'selectClue', categoryIdx: catIdx, clueIdx })}
          />
        ))
      ))}
    </div>
  );
}
