import { describe, it, expect } from 'vitest';
import { applyEvent, createInitialState } from '../../party/state';
import type { Game } from '../../src/types';
import generalTrivia from '../../src/games/general-trivia.json';

const TEST_GAME = generalTrivia as Game;

function seedRoom(playerCount: number): any {
  let state = createInitialState();
  state = (applyEvent(state, { type: 'claimHost' }, 'host') as any).state;
  for (let i = 0; i < playerCount; i++) {
    state = (applyEvent(state, { type: 'setNickname', nickname: `P${i}` }, `p${i}`) as any).state;
  }
  return state;
}

describe('createInitialState', () => {
  it('returns a lobby state with no players, no host, no game', () => {
    const state = createInitialState();
    expect(state.phase).toBe('lobby');
    expect(state.hostId).toBeNull();
    expect(state.players).toEqual([]);
    expect(state.game).toBeNull();
    expect(state.board).toBeNull();
    expect(state.buzzer).toEqual({ status: 'closed' });
    expect(state.pickerId).toBeNull();
    expect(state.scores).toEqual({});
    expect(state.finalJeopardy).toBeNull();
  });
});

describe('setNickname', () => {
  it('adds a player on first call', () => {
    const result = applyEvent(createInitialState(), { type: 'setNickname', nickname: 'Alice' }, 'conn-1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.players).toEqual([
      { id: 'conn-1', nickname: 'Alice', connected: true },
    ]);
  });

  it('updates nickname if the same connection sends again', () => {
    let state = createInitialState();
    state = (applyEvent(state, { type: 'setNickname', nickname: 'Alice' }, 'conn-1') as any).state;
    state = (applyEvent(state, { type: 'setNickname', nickname: 'Allie' }, 'conn-1') as any).state;
    expect(state.players).toHaveLength(1);
    expect(state.players[0].nickname).toBe('Allie');
  });

  it('appends a suffix when nickname is taken', () => {
    let state = createInitialState();
    state = (applyEvent(state, { type: 'setNickname', nickname: 'Alice' }, 'conn-1') as any).state;
    state = (applyEvent(state, { type: 'setNickname', nickname: 'Alice' }, 'conn-2') as any).state;
    expect(state.players[1].nickname).toBe('Alice (2)');
  });

  it('rejects when the room is full (20 players)', () => {
    let state = createInitialState();
    for (let i = 0; i < 20; i++) {
      state = (applyEvent(state, { type: 'setNickname', nickname: `P${i}` }, `conn-${i}`) as any).state;
    }
    const result = applyEvent(state, { type: 'setNickname', nickname: 'Late' }, 'conn-late');
    expect(result.ok).toBe(false);
  });
});

describe('claimHost', () => {
  it('sets hostId for the first claimant', () => {
    const result = applyEvent(createInitialState(), { type: 'claimHost' }, 'conn-host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.hostId).toBe('conn-host');
  });

  it('rejects a second claimant', () => {
    let state = createInitialState();
    state = (applyEvent(state, { type: 'claimHost' }, 'conn-1') as any).state;
    const result = applyEvent(state, { type: 'claimHost' }, 'conn-2');
    expect(result.ok).toBe(false);
  });
});

describe('selectGame', () => {
  it('host can select a game in lobby', () => {
    const state = seedRoom(2);
    const result = applyEvent(state, { type: 'selectGame', gameId: TEST_GAME.id }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.game?.id).toBe(TEST_GAME.id);
  });

  it('non-host cannot select a game', () => {
    const state = seedRoom(2);
    const result = applyEvent(state, { type: 'selectGame', gameId: TEST_GAME.id }, 'p0');
    expect(result.ok).toBe(false);
  });

  it('unknown gameId is rejected', () => {
    const state = seedRoom(2);
    const result = applyEvent(state, { type: 'selectGame', gameId: 'nope' }, 'host');
    expect(result.ok).toBe(false);
  });
});

describe('startGame', () => {
  it('transitions to selectingClue with board and pickerId set', () => {
    let state = seedRoom(3);
    state = (applyEvent(state, { type: 'selectGame', gameId: TEST_GAME.id }, 'host') as any).state;
    const result = applyEvent(state, { type: 'startGame' }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe('selectingClue');
    expect(result.state.pickerId).toBe('p0');
    expect(result.state.board?.revealed).toHaveLength(6);
    expect(result.state.board?.revealed[0]).toHaveLength(5);
    expect(result.state.board?.revealed[0][0]).toBe(false);
    expect(result.state.scores).toEqual({ p0: 0, p1: 0, p2: 0 });
  });

  it('rejects start with fewer than 2 players', () => {
    let state = seedRoom(1);
    state = (applyEvent(state, { type: 'selectGame', gameId: TEST_GAME.id }, 'host') as any).state;
    const result = applyEvent(state, { type: 'startGame' }, 'host');
    expect(result.ok).toBe(false);
  });

  it('rejects start with no game selected', () => {
    const state = seedRoom(2);
    const result = applyEvent(state, { type: 'startGame' }, 'host');
    expect(result.ok).toBe(false);
  });

  it('rejects start from non-host', () => {
    let state = seedRoom(2);
    state = (applyEvent(state, { type: 'selectGame', gameId: TEST_GAME.id }, 'host') as any).state;
    const result = applyEvent(state, { type: 'startGame' }, 'p0');
    expect(result.ok).toBe(false);
  });
});
