import { useParams } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { Lobby } from '../components/Lobby';
import { GameBoard } from '../components/GameBoard';
import { Scoreboard } from '../components/Scoreboard';
import { ClueModal } from '../components/ClueModal';
import { FinalJeopardy } from '../components/FinalJeopardy';
import { GameOver } from '../components/GameOver';

const CLUE_PHASES = ['clueRevealed', 'buzzerOpen', 'judging'] as const;
const FJ_PHASES = ['roundComplete', 'finalCategoryShown', 'finalClueShown', 'finalReveal'];

export function Room() {
  const { code } = useParams<{ code: string }>();
  const { state, me, send } = useGameState(code!);

  if (!state || !me) return <main className="p-6">Connecting to room {code}…</main>;

  // If we landed in a room with no host (and we aren't claiming host ourselves),
  // it means the room code doesn't correspond to an active room.
  if (state.hostId === null && !me.isHost) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-bold">Room not found</h1>
        <p>Ask the host for a valid room code.</p>
        <a href="/" className="text-blue-600 underline">Go home</a>
      </main>
    );
  }

  if (state.phase === 'lobby') {
    return <Lobby state={state} me={me} send={send} roomCode={code!} />;
  }

  if (FJ_PHASES.includes(state.phase)) {
    return (
      <div className="flex min-h-screen">
        <main className="flex-1">
          <FinalJeopardy state={state} me={me} send={send} />
        </main>
        <Scoreboard state={state} />
      </div>
    );
  }

  if (state.phase === 'gameOver') {
    return (
      <div className="flex min-h-screen">
        <main className="flex-1">
          <GameOver state={state} me={me} send={send} />
        </main>
        <Scoreboard state={state} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <main className="flex-1">
        <GameBoard state={state} me={me} send={send} />
      </main>
      <Scoreboard state={state} />
      {CLUE_PHASES.includes(state.phase as any) && (
        <ClueModal state={state} me={me} send={send} />
      )}
    </div>
  );
}
