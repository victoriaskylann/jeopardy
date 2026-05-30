import type { ClientEvent, RoomState } from '../types';
import type { Me } from '../hooks/useGameState';

type Props = {
  state: RoomState;
  me: Me;
  send: (event: ClientEvent) => void;
};

export function GameOver({ state, me, send }: Props) {
  const sorted = [...state.players].sort(
    (a, b) => (state.scores[b.id] ?? 0) - (state.scores[a.id] ?? 0),
  );
  const topScore = sorted.length > 0 ? state.scores[sorted[0].id] ?? 0 : 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 p-10">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-mustard">
          that's all
        </p>
        <h2 className="mt-2 font-display text-5xl font-semibold text-teal">
          Final Scores
        </h2>
      </div>

      <ol className="w-full space-y-2">
        {sorted.map((p, idx) => {
          const score = state.scores[p.id] ?? 0;
          const isWinner = idx === 0 && topScore > 0;
          return (
            <li
              key={p.id}
              className={`flex items-center justify-between rounded-2xl px-5 py-4 ${
                isWinner
                  ? 'bg-mustard text-cream-light'
                  : 'bg-cream-light text-teal'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="font-display text-2xl opacity-60">
                  {idx + 1}
                </span>
                <span className="font-medium">{p.nickname}</span>
                {isWinner && <span>🏆</span>}
              </span>
              <span
                className={`font-display text-2xl ${
                  score < 0
                    ? 'text-terracotta-dark'
                    : isWinner
                      ? 'text-cream-light'
                      : 'text-teal'
                }`}
              >
                ${score}
              </span>
            </li>
          );
        })}
      </ol>

      {me.isHost && (
        <button
          className="rounded-full bg-teal px-8 py-4 font-semibold text-cream-light shadow-sm transition hover:bg-teal-dark"
          onClick={() => send({ type: 'endGame' })}
        >
          New Game
        </button>
      )}
    </div>
  );
}
