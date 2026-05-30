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
    <div className="grid grid-cols-6 gap-3 p-6">
      {state.game.jeopardyRound.categories.map((cat, catIdx) => (
        <div
          key={catIdx}
          className="flex h-28 items-center justify-center rounded-2xl bg-teal-dark p-3 text-center"
        >
          <span className="font-display text-lg leading-tight text-cream-light">
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
