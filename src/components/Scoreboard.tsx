import type { RoomState } from '../types';

type Props = { state: RoomState };

export function Scoreboard({ state }: Props) {
  return (
    <aside className="w-72 border-l-2 border-lavender-light bg-peach p-6">
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
  );
}
