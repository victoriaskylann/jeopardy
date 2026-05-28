import type { RoomState } from '../types';

type Props = { state: RoomState };

export function Scoreboard({ state }: Props) {
  return (
    <aside className="w-64 border-l bg-slate-50 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Scores
      </h2>
      <ul className="space-y-1">
        {state.players.map((p) => (
          <li
            key={p.id}
            className={`flex items-center justify-between rounded px-2 py-1 ${
              state.pickerId === p.id ? 'bg-blue-100 font-medium' : ''
            }`}
          >
            <span className={p.connected ? '' : 'opacity-50'}>
              {p.nickname}
              {state.pickerId === p.id && ' •'}
            </span>
            <span
              className={
                (state.scores[p.id] ?? 0) < 0 ? 'text-red-600' : 'text-slate-900'
              }
            >
              ${state.scores[p.id] ?? 0}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
