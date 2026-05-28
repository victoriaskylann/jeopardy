import type { ClientEvent, RoomState } from '../types';
import type { Me } from '../hooks/useGameState';

type Props = {
  state: RoomState;
  me: Me;
  send: (event: ClientEvent) => void;
};

export function BuzzerControls({ state, me, send }: Props) {
  if (me.isHost) {
    return <HostControls state={state} send={send} />;
  }
  return <PlayerBuzzer state={state} me={me} send={send} />;
}

function HostControls({ state, send }: { state: RoomState; send: (e: ClientEvent) => void }) {
  if (state.phase === 'clueRevealed') {
    return (
      <button
        className="rounded-lg bg-amber-500 px-6 py-3 text-lg font-bold text-white"
        onClick={() => send({ type: 'openBuzzer' })}
      >
        Open Buzzer
      </button>
    );
  }
  if (state.phase === 'buzzerOpen') {
    return (
      <button
        className="rounded-lg bg-slate-600 px-6 py-3 font-medium text-white"
        onClick={() => send({ type: 'closeBuzzer' })}
      >
        No One
      </button>
    );
  }
  if (state.phase === 'judging') {
    const buzzerLocked = state.buzzer.status === 'locked';
    return (
      <div className="flex flex-wrap gap-3">
        {buzzerLocked && (
          <>
            <button
              className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white"
              onClick={() => send({ type: 'judgeCorrect' })}
            >
              Correct
            </button>
            <button
              className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white"
              onClick={() => send({ type: 'judgeWrong' })}
            >
              Wrong
            </button>
          </>
        )}
        {!buzzerLocked && (
          <button
            className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-white"
            onClick={() => send({ type: 'openBuzzer' })}
          >
            Reopen Buzzer
          </button>
        )}
        <button
          className="rounded-lg bg-slate-600 px-4 py-2 font-medium text-white"
          onClick={() => send({ type: 'moveOn' })}
        >
          Move On
        </button>
      </div>
    );
  }
  return null;
}

function PlayerBuzzer({ state, me, send }: { state: RoomState; me: Me; send: (e: ClientEvent) => void }) {
  const open = state.phase === 'buzzerOpen';
  const youWon = state.buzzer.status === 'locked' && state.buzzer.winnerId === me.playerId;

  if (youWon) {
    return (
      <div className="rounded-lg bg-green-100 px-6 py-4 text-center text-xl font-bold text-green-900">
        Your buzz! Answer aloud.
      </div>
    );
  }

  return (
    <button
      className={`h-32 w-full rounded-2xl text-2xl font-bold text-white transition ${
        open ? 'bg-red-600 active:scale-95' : 'bg-slate-300'
      }`}
      disabled={!open}
      onClick={() => send({ type: 'buzz' })}
    >
      {open ? 'BUZZ' : 'Wait…'}
    </button>
  );
}
