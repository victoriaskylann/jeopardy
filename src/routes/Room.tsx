import { useParams } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';

export function Room() {
  const { code } = useParams<{ code: string }>();
  const { state, me } = useGameState(code!);

  if (!state || !me) {
    return <main className="p-6">Connecting to room {code}…</main>;
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">Room {code}</h1>
      <p>Phase: {state.phase}</p>
      <p>You are: {me.playerId} {me.isHost && '(host)'}</p>
    </main>
  );
}
