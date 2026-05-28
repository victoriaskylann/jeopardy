import { useState } from 'react';
import type { RoomState } from '../types';
import type { Me } from '../hooks/useGameState';
import type { ClientEvent } from '../types';
import { GAMES } from '../games/manifest';

type Props = {
  state: RoomState;
  me: Me;
  send: (event: ClientEvent) => void;
  roomCode: string;
};

export function Lobby({ state, me, send, roomCode }: Props) {
  const myPlayer = state.players.find((p) => p.id === me.playerId);
  const [nickname, setNickname] = useState('');

  if (!me.isHost && !myPlayer) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
        <h1 className="text-2xl font-bold">Join Room {roomCode}</h1>
        <input
          className="w-full rounded-lg border px-3 py-2 text-lg"
          placeholder="Your nickname"
          maxLength={24}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
          disabled={!nickname.trim()}
          onClick={() => send({ type: 'setNickname', nickname: nickname.trim() })}
        >
          Join
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lobby</h1>
        <code className="rounded bg-slate-100 px-3 py-1 text-lg">{roomCode}</code>
      </header>

      <section>
        <h2 className="mb-2 font-medium">Players ({state.players.length}/20)</h2>
        <ul className="divide-y rounded-lg border">
          {state.players.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-3 py-2">
              <span className={p.connected ? '' : 'opacity-50'}>{p.nickname}</span>
              {!p.connected && <span className="text-xs text-slate-500">offline</span>}
            </li>
          ))}
          {state.players.length === 0 && (
            <li className="px-3 py-2 text-slate-500">Waiting for players…</li>
          )}
        </ul>
      </section>

      {me.isHost && (
        <>
          <section>
            <h2 className="mb-2 font-medium">Choose a game</h2>
            <ul className="space-y-2">
              {GAMES.map((g) => (
                <li key={g.id}>
                  <button
                    className={`w-full rounded-lg border px-3 py-2 text-left ${
                      state.game?.id === g.id ? 'border-blue-600 bg-blue-50' : ''
                    }`}
                    onClick={() => send({ type: 'selectGame', gameId: g.id })}
                  >
                    {g.title}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <button
            className="rounded-lg bg-green-600 px-4 py-3 font-medium text-white disabled:opacity-50"
            disabled={!state.game || state.players.length < 2}
            onClick={() => send({ type: 'startGame' })}
          >
            Start game
          </button>
        </>
      )}
    </main>
  );
}
