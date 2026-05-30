import { Fragment, useEffect, useState } from 'react';
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
  return (
    <>
      <MobileBoard state={state} me={me} send={send} />
      <DesktopBoard state={state} me={me} send={send} />
    </>
  );
}

function MobileBoard({ state, me, send }: Props) {
  const [openCategory, setOpenCategory] = useState<number | null>(null);
  const isPicker = state.pickerId === me.playerId;

  // Whenever a clue finishes and we return to selecting, drop back to the
  // category list so the picker always starts at the top.
  useEffect(() => {
    if (state.phase === 'selectingClue') setOpenCategory(null);
  }, [state.phase]);

  if (!state.game || !state.board) return null;

  if (openCategory !== null) {
    const cat = state.game.jeopardyRound.categories[openCategory];
    return (
      <div className="p-4 md:hidden">
        <button
          onClick={() => setOpenCategory(null)}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-teal/70 hover:text-teal"
        >
          ← Categories
        </button>
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-mustard">
          {cat.name}
        </p>
        <ul className="space-y-2">
          {cat.clues.map((clue, clueIdx) => {
            const revealed = state.board!.revealed[openCategory][clueIdx];
            const clickable = isPicker && !revealed;
            return (
              <li key={clueIdx}>
                <button
                  disabled={!clickable}
                  onClick={() =>
                    send({ type: 'selectClue', categoryIdx: openCategory, clueIdx })
                  }
                  className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left shadow-sm transition active:scale-[0.98] ${
                    revealed
                      ? 'bg-lavender-light text-teal/30'
                      : clickable
                        ? 'bg-teal text-mustard hover:bg-teal-dark'
                        : 'bg-teal/60 text-mustard/70'
                  }`}
                >
                  <span className="font-display text-3xl font-semibold">
                    ${clue.value}
                  </span>
                  {revealed && (
                    <span className="text-xs uppercase tracking-[0.2em]">
                      played
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="p-4 md:hidden">
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-mustard">
        {isPicker ? 'Pick a category' : 'Categories'}
      </p>
      <ul className="space-y-2">
        {state.game.jeopardyRound.categories.map((cat, catIdx) => {
          const remaining = state.board!.revealed[catIdx].filter(
            (r) => !r,
          ).length;
          const empty = remaining === 0;
          return (
            <li key={catIdx}>
              <button
                onClick={() => setOpenCategory(catIdx)}
                disabled={empty}
                className="flex w-full items-center justify-between rounded-2xl bg-teal-dark px-5 py-4 text-left text-cream-light shadow-sm transition active:scale-[0.98] disabled:opacity-40"
              >
                <span className="font-display text-lg font-semibold leading-tight">
                  {cat.name}
                </span>
                <span className="text-xs font-medium text-mustard">
                  {remaining}/5
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DesktopBoard({ state, me, send }: Props) {
  if (!state.game || !state.board) return null;
  const isPicker = state.pickerId === me.playerId;

  return (
    <div className="hidden h-full grid-cols-6 grid-rows-[auto_repeat(5,minmax(0,1fr))] gap-3 p-6 md:grid">
      {state.game.jeopardyRound.categories.map((cat, catIdx) => (
        <div
          key={catIdx}
          className="flex min-h-20 items-center justify-center rounded-2xl bg-teal-dark p-3 text-center"
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
