import type { ClientEvent, RoomState } from "../types";
import type { Me } from "../hooks/useGameState";

type Props = {
  state: RoomState;
  me: Me;
  send: (event: ClientEvent) => void;
};

const pillBase =
  "rounded-full px-6 py-3 font-semibold shadow-sm transition disabled:opacity-40";

export function BuzzerControls({ state, me, send }: Props) {
  if (me.isHost) {
    return <HostControls state={state} send={send} />;
  }
  return <PlayerBuzzer state={state} me={me} send={send} />;
}

function HostControls({
  state,
  send,
}: {
  state: RoomState;
  send: (e: ClientEvent) => void;
}) {
  if (state.phase === "clueRevealed") {
    return (
      <button
        className={`${pillBase} bg-mustard text-cream-light hover:bg-mustard-dark`}
        onClick={() => send({ type: "openBuzzer" })}
      >
        Open Buzzer
      </button>
    );
  }
  if (state.phase === "buzzerOpen") {
    return (
      <button
        className={`${pillBase} bg-lavender text-teal-dark hover:bg-lavender/80`}
        onClick={() => send({ type: "closeBuzzer" })}
      >
        No One
      </button>
    );
  }
  if (state.phase === "judging") {
    const buzzerLocked = state.buzzer.status === "locked";
    return (
      <div className="flex flex-wrap justify-center gap-3">
        {buzzerLocked && (
          <>
            <button
              className={`${pillBase} bg-mustard text-cream-light hover:bg-teal-dark`}
              onClick={() => send({ type: "judgeCorrect" })}
            >
              Correct
            </button>
            <button
              className={`${pillBase} bg-terracotta text-cream-light hover:bg-terracotta-dark`}
              onClick={() => send({ type: "judgeWrong" })}
            >
              Wrong
            </button>
          </>
        )}
        {!buzzerLocked && (
          <button
            className={`${pillBase} bg-mustard text-cream-light hover:bg-mustard-dark`}
            onClick={() => send({ type: "openBuzzer" })}
          >
            Reopen Buzzer
          </button>
        )}
        <button
          className={`${pillBase} bg-lavender text-teal-dark hover:bg-lavender/80`}
          onClick={() => send({ type: "moveOn" })}
        >
          Move On
        </button>
      </div>
    );
  }
  return null;
}

function PlayerBuzzer({
  state,
  me,
  send,
}: {
  state: RoomState;
  me: Me;
  send: (e: ClientEvent) => void;
}) {
  const open = state.phase === "buzzerOpen";
  const youWon =
    state.buzzer.status === "locked" && state.buzzer.winnerId === me.playerId;

  if (youWon) {
    return (
      <div className="rounded-3xl bg-mustard px-8 py-6 text-center font-display text-2xl font-semibold text-cream-light shadow-sm">
        Your buzz! Answer aloud.
      </div>
    );
  }

  return (
    <button
      className={`h-40 w-full select-none rounded-3xl font-display text-4xl font-semibold transition sm:h-32 sm:text-3xl ${
        open
          ? "bg-terracotta text-cream-light shadow-lg active:scale-95 hover:bg-terracotta-dark"
          : "bg-lavender-light text-teal/40"
      }`}
      disabled={!open}
      onClick={() => send({ type: "buzz" })}
    >
      {open ? "BUZZ" : "Wait…"}
    </button>
  );
}
