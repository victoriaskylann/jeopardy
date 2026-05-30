import { useParams } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { Lobby } from '../components/Lobby';
import { GameBoard } from '../components/GameBoard';
import { Scoreboard } from '../components/Scoreboard';
import { ClueModal } from '../components/ClueModal';
import { FinalJeopardy } from '../components/FinalJeopardy';
import { GameOver } from '../components/GameOver';
import { HostHeader } from '../components/HostHeader';

const CLUE_PHASES = ['clueRevealed', 'buzzerOpen', 'judging'] as const;
const FJ_PHASES = ['roundComplete', 'finalCategoryShown', 'finalClueShown', 'finalReveal'];

export function Room() {
  const { code } = useParams<{ code: string }>();
  const { state, me, send } = useGameState(code!);

  if (!state || !me) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="font-display text-2xl text-teal">
          Connecting to room <span className="text-mustard">{code}</span>…
        </p>
      </main>
    );
  }

  // If we landed in a room with no host (and we aren't claiming host ourselves),
  // it means the room code doesn't correspond to an active room.
  if (state.hostId === null && !me.isHost) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="font-display text-4xl font-semibold text-teal">
          Room not found
        </h1>
        <p className="text-teal/70">Ask the host for a valid room code.</p>
        <a
          href="/"
          className="rounded-full bg-mustard px-6 py-3 font-semibold text-cream-light shadow-sm transition hover:bg-mustard-dark"
        >
          Go home
        </a>
      </main>
    );
  }

  const overlay =
    !state.hostConnected && state.phase !== 'lobby' ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-dark/70 p-4 backdrop-blur-sm">
        <div className="rounded-3xl bg-cream-light px-10 py-8 text-center shadow-2xl">
          <p className="font-display text-2xl font-semibold text-teal">
            Host disconnected
          </p>
          <p className="mt-1 text-teal/70">Waiting for them to reconnect…</p>
        </div>
      </div>
    ) : null;

  const header = me.isHost ? (
    <HostHeader title={state.game?.title ?? 'jepardy'} />
  ) : null;

  if (state.phase === 'lobby') {
    return (
      <>
        {header}
        <Lobby state={state} me={me} send={send} roomCode={code!} />
      </>
    );
  }

  if (FJ_PHASES.includes(state.phase)) {
    return (
      <div className="flex min-h-screen flex-col">
        {header}
        <div className="flex flex-1 flex-col md:flex-row">
          <main className="flex-1">
            <FinalJeopardy state={state} me={me} send={send} />
          </main>
          <Scoreboard state={state} />
        </div>
        {overlay}
      </div>
    );
  }

  if (state.phase === 'gameOver') {
    return (
      <div className="flex min-h-screen flex-col">
        {header}
        <div className="flex flex-1 flex-col md:flex-row">
          <main className="flex-1">
            <GameOver state={state} me={me} send={send} />
          </main>
          <Scoreboard state={state} />
        </div>
        {overlay}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:h-dvh md:min-h-0">
      {header}
      <div className="flex flex-1 flex-col md:flex-row md:overflow-hidden">
        <main className="min-h-0 flex-1 md:overflow-hidden">
          <GameBoard state={state} me={me} send={send} />
        </main>
        <Scoreboard state={state} />
      </div>
      {CLUE_PHASES.includes(state.phase as any) && (
        <ClueModal state={state} me={me} send={send} />
      )}
      {overlay}
    </div>
  );
}
