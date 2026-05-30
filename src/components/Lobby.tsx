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
    const submit = () => {
      const trimmed = nickname.trim();
      if (trimmed) send({ type: 'setNickname', nickname: trimmed });
    };
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 p-6">
        <div className="flex flex-col items-center gap-2">
          <span className="font-sans text-xs uppercase tracking-[0.3em] text-mustard">
            joining room
          </span>
          <code className="rounded-full bg-lavender-light px-5 py-1 font-display text-3xl text-teal">
            {roomCode}
          </code>
        </div>
        <form
          className="flex w-full flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            aria-label="Your nickname"
            className="w-full rounded-full border-2 border-teal/30 bg-cream-light px-5 py-3 text-lg text-teal placeholder:text-teal/40 focus:border-teal focus:outline-none"
            placeholder="Your nickname"
            maxLength={24}
            autoFocus
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-full bg-mustard px-6 py-3 font-semibold text-cream-light shadow-sm transition hover:bg-mustard-dark disabled:opacity-40"
            disabled={!nickname.trim()}
          >
            Join
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-semibold text-teal">Lobby</h1>
        <div className="flex flex-col items-end">
          <span className="text-xs uppercase tracking-[0.25em] text-mustard">
            room code
          </span>
          <code className="font-display text-2xl text-teal">{roomCode}</code>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.3em] text-mustard">
          Players ({state.players.length}/20)
        </h2>
        <ul className="space-y-2">
          {state.players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-2xl bg-cream-light px-4 py-3"
            >
              <span
                className={`text-teal ${p.connected ? '' : 'opacity-40'}`}
              >
                {p.nickname}
              </span>
              {!p.connected && (
                <span className="text-xs uppercase tracking-wider text-terracotta">
                  offline
                </span>
              )}
            </li>
          ))}
          {state.players.length === 0 && (
            <li className="rounded-2xl bg-cream-light px-4 py-3 text-teal/50">
              Waiting for players…
            </li>
          )}
        </ul>
      </section>

      {me.isHost && (
        <>
          <section>
            <h2 className="mb-3 text-xs uppercase tracking-[0.3em] text-mustard">
              Choose a game
            </h2>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {GAMES.map((g) => {
                const selected = state.game?.id === g.id;
                return (
                  <li key={g.id}>
                    <button
                      className={`w-full rounded-2xl border-2 px-4 py-4 text-left font-display text-lg transition ${
                        selected
                          ? 'border-mustard bg-peach text-teal-dark'
                          : 'border-transparent bg-cream-light text-teal hover:border-lavender'
                      }`}
                      onClick={() => send({ type: 'selectGame', gameId: g.id })}
                    >
                      {g.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <button
            className="rounded-full bg-teal px-6 py-4 font-semibold text-cream-light shadow-sm transition hover:bg-teal-dark disabled:opacity-40"
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
