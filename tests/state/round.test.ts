import { describe, it, expect, beforeEach } from 'vitest';
import { applyEvent, createInitialState } from '../../party/state';
import type { RoomState, Game } from '../../src/types';
import generalTrivia from '../../src/games/general-trivia.json';

const GAME = generalTrivia as Game;

function startedRoom(playerCount = 3): RoomState {
  let state = createInitialState();
  state = (applyEvent(state, { type: 'claimHost' }, 'host') as any).state;
  for (let i = 0; i < playerCount; i++) {
    state = (applyEvent(state, { type: 'setNickname', nickname: `P${i}` }, `p${i}`) as any).state;
  }
  state = (applyEvent(state, { type: 'selectGame', gameId: GAME.id }, 'host') as any).state;
  state = (applyEvent(state, { type: 'startGame' }, 'host') as any).state;
  return state;
}

describe('selectClue', () => {
  it('picker can select an unrevealed clue', () => {
    const result = applyEvent(startedRoom(), { type: 'selectClue', categoryIdx: 0, clueIdx: 0 }, 'p0');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe('clueRevealed');
    expect(result.state.selectedClue).toEqual({ categoryIdx: 0, clueIdx: 0 });
    expect(result.state.board?.revealed[0][0]).toBe(true);
  });

  it('non-picker cannot select', () => {
    const result = applyEvent(startedRoom(), { type: 'selectClue', categoryIdx: 0, clueIdx: 0 }, 'p1');
    expect(result.ok).toBe(false);
  });

  it('cannot select already-revealed clue', () => {
    let state = startedRoom();
    state = (applyEvent(state, { type: 'selectClue', categoryIdx: 0, clueIdx: 0 }, 'p0') as any).state;
    // We are now in clueRevealed phase. selecting again should also fail because phase isn't selectingClue.
    const result = applyEvent(state, { type: 'selectClue', categoryIdx: 0, clueIdx: 0 }, 'p0');
    expect(result.ok).toBe(false);
  });
});

describe('openBuzzer', () => {
  it('host can open buzzer from clueRevealed', () => {
    let state = startedRoom();
    state = (applyEvent(state, { type: 'selectClue', categoryIdx: 0, clueIdx: 0 }, 'p0') as any).state;
    const result = applyEvent(state, { type: 'openBuzzer' }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe('buzzerOpen');
    expect(result.state.buzzer.status).toBe('open');
  });

  it('non-host cannot open buzzer', () => {
    let state = startedRoom();
    state = (applyEvent(state, { type: 'selectClue', categoryIdx: 0, clueIdx: 0 }, 'p0') as any).state;
    const result = applyEvent(state, { type: 'openBuzzer' }, 'p0');
    expect(result.ok).toBe(false);
  });

  it('cannot open buzzer outside clueRevealed or judging', () => {
    const result = applyEvent(startedRoom(), { type: 'openBuzzer' }, 'host');
    expect(result.ok).toBe(false);
  });
});
