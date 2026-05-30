import { describe, it, expect } from 'vitest';
import {
  applyEvent,
  createInitialState,
  markDisconnected,
  markReconnected,
} from '../../party/state';

function lobby() {
  let s = createInitialState();
  s = (applyEvent(s, { type: 'claimHost' }, 'host') as any).state;
  s = (applyEvent(s, { type: 'setNickname', nickname: 'Alice' }, 'p0') as any).state;
  s = (applyEvent(s, { type: 'setNickname', nickname: 'Bob' }, 'p1') as any).state;
  return s;
}

describe('markDisconnected / markReconnected', () => {
  it('marks a player as disconnected without removing them', () => {
    const s = markDisconnected(lobby(), 'p0');
    expect(s.players.find((p) => p.id === 'p0')?.connected).toBe(false);
    expect(s.players).toHaveLength(2);
  });

  it('re-connects a known player', () => {
    let s = markDisconnected(lobby(), 'p0');
    s = markReconnected(s, 'p0');
    expect(s.players.find((p) => p.id === 'p0')?.connected).toBe(true);
  });

  it('disconnecting an unknown id is a no-op', () => {
    const s = markDisconnected(lobby(), 'unknown');
    expect(s.players).toHaveLength(2);
  });
});

describe('kickPlayer', () => {
  it('host can kick a player; player and their score are removed', () => {
    let s = lobby();
    s = (applyEvent(s, { type: 'selectGame', gameId: 'general-trivia' }, 'host') as any).state;
    s = (applyEvent(s, { type: 'startGame' }, 'host') as any).state;
    const result = applyEvent(s, { type: 'kickPlayer', playerId: 'p1' }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.players.map((p) => p.id)).toEqual(['p0']);
    expect(result.state.scores.p1).toBeUndefined();
  });

  it('non-host cannot kick', () => {
    const result = applyEvent(lobby(), { type: 'kickPlayer', playerId: 'p1' }, 'p0');
    expect(result.ok).toBe(false);
  });

  it('kicking the current picker advances picker to next player', () => {
    let s = lobby();
    s = (applyEvent(s, { type: 'selectGame', gameId: 'general-trivia' }, 'host') as any).state;
    s = (applyEvent(s, { type: 'startGame' }, 'host') as any).state;
    expect(s.pickerId).toBe('p0');
    const result = applyEvent(s, { type: 'kickPlayer', playerId: 'p0' }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.pickerId).toBe('p1');
  });
});
