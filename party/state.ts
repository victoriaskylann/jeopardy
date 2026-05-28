import type { RoomState, ClientEvent } from '../src/types';

export function createInitialState(): RoomState {
  return {
    phase: 'lobby',
    hostId: null,
    players: [],
    game: null,
    board: null,
    selectedClue: null,
    buzzer: { status: 'closed' },
    pickerId: null,
    scores: {},
    finalJeopardy: null,
  };
}

export type ApplyResult =
  | { ok: true; state: RoomState }
  | { ok: false; error: string };

const MAX_PLAYERS = 20;

export function applyEvent(state: RoomState, event: ClientEvent, senderId: string): ApplyResult {
  switch (event.type) {
    case 'setNickname':
      return handleSetNickname(state, event.nickname, senderId);
    case 'claimHost':
      return handleClaimHost(state, senderId);
    default:
      return { ok: false, error: `Unhandled event: ${event.type}` };
  }
}

function handleSetNickname(state: RoomState, nickname: string, senderId: string): ApplyResult {
  const existing = state.players.find((p) => p.id === senderId);
  if (existing) {
    return {
      ok: true,
      state: {
        ...state,
        players: state.players.map((p) =>
          p.id === senderId ? { ...p, nickname: uniquify(nickname, state.players, senderId) } : p,
        ),
      },
    };
  }
  if (state.players.length >= MAX_PLAYERS) {
    return { ok: false, error: 'Room is full' };
  }
  const unique = uniquify(nickname, state.players, senderId);
  return {
    ok: true,
    state: {
      ...state,
      players: [...state.players, { id: senderId, nickname: unique, connected: true }],
    },
  };
}

function uniquify(nickname: string, players: { id: string; nickname: string }[], selfId: string): string {
  const taken = new Set(players.filter((p) => p.id !== selfId).map((p) => p.nickname));
  if (!taken.has(nickname)) return nickname;
  let n = 2;
  while (taken.has(`${nickname} (${n})`)) n++;
  return `${nickname} (${n})`;
}

function handleClaimHost(state: RoomState, senderId: string): ApplyResult {
  if (state.hostId !== null) {
    return { ok: false, error: 'Host already claimed' };
  }
  return { ok: true, state: { ...state, hostId: senderId } };
}
