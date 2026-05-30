import { Fragment } from 'react';
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
    <div className="grid grid-cols-6 gap-1.5 p-3 sm:gap-3 sm:p-6">
      {state.game.jeopardyRound.categories.map((cat, catIdx) => (
        <div
          key={catIdx}
          className="flex h-16 items-center justify-center rounded-lg bg-teal-dark p-1 text-center sm:h-28 sm:rounded-2xl sm:p-3"
        >
          <span className="font-display text-[10px] leading-tight text-cream-light sm:text-lg">
            {cat.name}
          </span>
        </div>
      ))}
      {Array.from({ length: 5 }).map((_, clueIdx) => (
        <Fragment key={clueIdx}>
          {state.game!.jeopardyRound.categories.map((cat, catIdx) => (
            <ClueCell
              key={`${catIdx}-${clueIdx}`}
              value={cat.clues[clueIdx].value}
              revealed={state.board!.revealed[catIdx][clueIdx]}
              isPicker={isPicker}
              onClick={() => send({ type: 'selectClue', categoryIdx: catIdx, clueIdx })}
            />
          ))}
        </Fragment>
      ))}
    </div>
  );
}
