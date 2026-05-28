import { describe, it, expect } from 'vitest';
import { applyEvent, createInitialState } from '../../party/state';

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
