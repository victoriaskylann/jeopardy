import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../party/state';

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
