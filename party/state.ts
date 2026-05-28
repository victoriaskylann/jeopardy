import type { RoomState, ClientEvent } from '../src/types';
import { getGameById } from '../src/games/manifest';

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
    case 'selectGame':
      return handleSelectGame(state, event.gameId, senderId);
    case 'startGame':
      return handleStartGame(state, senderId);
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

function handleSelectGame(state: RoomState, gameId: string, senderId: string): ApplyResult {
  if (state.hostId !== senderId) return { ok: false, error: 'Only host can select game' };
  if (state.phase !== 'lobby') return { ok: false, error: 'Game already started' };
  const game = getGameById(gameId);
  if (!game) return { ok: false, error: 'Unknown game' };
  return { ok: true, state: { ...state, game } };
}

function handleStartGame(state: RoomState, senderId: string): ApplyResult {
  if (state.hostId !== senderId) return { ok: false, error: 'Only host can start' };
  if (state.phase !== 'lobby') return { ok: false, error: 'Game already started' };
  if (!state.game) return { ok: false, error: 'No game selected' };
  if (state.players.length < 2) return { ok: false, error: 'Need at least 2 players' };

  const revealed = state.game.jeopardyRound.categories.map((c) => c.clues.map(() => false));
  const scores: Record<string, number> = {};
  for (const p of state.players) scores[p.id] = 0;
  const pickerId = state.players[0].id;

  return {
    ok: true,
    state: {
      ...state,
      phase: 'selectingClue',
      board: { revealed },
      scores,
      pickerId,
    },
  };
}
