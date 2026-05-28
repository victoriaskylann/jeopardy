import { useParams } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { Lobby } from '../components/Lobby';
import { GameBoard } from '../components/GameBoard';
import { Scoreboard } from '../components/Scoreboard';
import { ClueModal } from '../components/ClueModal';

const CLUE_PHASES = ['clueRevealed', 'buzzerOpen', 'judging'] as const;

export function Room() {
  const { code } = useParams<{ code: string }>();
  const { state, me, send } = useGameState(code!);

  if (!state || !me) return <main className="p-6">Connecting to room {code}…</main>;

  if (state.phase === 'lobby') {
    return <Lobby state={state} me={me} send={send} roomCode={code!} />;
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
