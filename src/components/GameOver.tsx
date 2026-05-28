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
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 p-8">
      <h2 className="text-3xl font-bold">Final Scores</h2>
      <ol className="w-full space-y-2">
        {sorted.map((p, idx) => (
          <li
            key={p.id}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              idx === 0 && topScore > 0 ? 'border-amber-500 bg-amber-50' : ''
            }`}
          >
            <span>
              {idx + 1}. {p.nickname}
              {idx === 0 && topScore > 0 && ' 🏆'}
            </span>
            <span className={(state.scores[p.id] ?? 0) < 0 ? 'text-red-600' : ''}>
              ${state.scores[p.id] ?? 0}
            </span>
          </li>
        ))}
      </ol>
      {me.isHost && (
        <button
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white"
          onClick={() => send({ type: 'endGame' })}
        >
          New Game
        </button>
      )}
    </div>
  );
}
