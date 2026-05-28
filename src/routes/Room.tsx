import { useParams } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { Lobby } from '../components/Lobby';

export function Room() {
  const { code } = useParams<{ code: string }>();
  const { state, me, send } = useGameState(code!);

  if (!state || !me) {
    return <main className="p-6">Connecting to room {code}…</main>;
  }

  if (state.phase === 'lobby') {
    return <Lobby state={state} me={me} send={send} roomCode={code!} />;
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">Room {code}</h1>
      <p>Phase: {state.phase}</p>
    </main>
  );
}
