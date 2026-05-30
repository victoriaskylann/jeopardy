import type { RoomState } from '../types';

type Props = { state: RoomState };

export function Scoreboard({ state }: Props) {
  return (
    <>
      {/* Mobile: horizontal scrolling pill bar at top */}
      <div className="order-first border-b-2 border-lavender-light bg-peach px-4 py-3 md:hidden">
        <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-mustard">
          Scores
        </h2>
        <ul className="-mx-1 flex gap-2 overflow-x-auto pb-1">
          {state.players.map((p) => {
            const score = state.scores[p.id] ?? 0;
            const isPicker = state.pickerId === p.id;
            return (
              <li
                key={p.id}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1 ${
                  isPicker
                    ? 'bg-mustard text-cream-light'
                    : 'bg-cream-light text-teal'
                }`}
              >
                <span
                  className={`text-sm font-medium ${p.connected ? '' : 'opacity-40'}`}
                >
                  {p.nickname}
                </span>
                <span
                  className={`font-display text-base ${
                    score < 0
                      ? 'text-terracotta-dark'
                      : isPicker
                        ? 'text-cream-light'
                        : 'text-teal'
                  }`}
                >
                  ${score}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Desktop: vertical sidebar on the right */}
      <aside className="hidden w-72 border-l-2 border-lavender-light bg-peach p-6 md:block">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-mustard">
          Scores
        </h2>
        <ul className="space-y-2">
          {state.players.map((p) => {
            const score = state.scores[p.id] ?? 0;
            const isPicker = state.pickerId === p.id;
            return (
              <li
                key={p.id}
                className={`flex items-center justify-between rounded-2xl px-4 py-2 ${
                  isPicker
                    ? 'bg-mustard text-cream-light'
                    : 'bg-cream-light text-teal'
                }`}
              >
                <span
                  className={`font-medium ${p.connected ? '' : 'opacity-40'}`}
                >
                  {p.nickname}
                  {isPicker && ' •'}
                </span>
                <span
                  className={`font-display text-lg ${
                    score < 0
                      ? 'text-terracotta-dark'
                      : isPicker
                        ? 'text-cream-light'
                        : 'text-teal'
                  }`}
                >
                  ${score}
                </span>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}
