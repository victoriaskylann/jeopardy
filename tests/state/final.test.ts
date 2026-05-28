import { describe, it, expect } from 'vitest';
import { applyEvent, createInitialState } from '../../party/state';
import type { RoomState, Game } from '../../src/types';
import generalTrivia from '../../src/games/general-trivia.json';

const GAME = generalTrivia as Game;

function roundCompleteRoom(scores: Record<string, number>): RoomState {
  let state = createInitialState();
  state = (applyEvent(state, { type: 'claimHost' }, 'host') as any).state;
  const playerIds = Object.keys(scores);
  for (const id of playerIds) {
    state = (applyEvent(state, { type: 'setNickname', nickname: id }, id) as any).state;
  }
  state = (applyEvent(state, { type: 'selectGame', gameId: GAME.id }, 'host') as any).state;
  state = (applyEvent(state, { type: 'startGame' }, 'host') as any).state;
  // Brute-force play every clue with no-buzz to reach roundComplete.
  for (let cat = 0; cat < 6; cat++) {
    for (let clue = 0; clue < 5; clue++) {
      state = (applyEvent(state, { type: 'selectClue', categoryIdx: cat, clueIdx: clue }, state.pickerId!) as any).state;
      state = (applyEvent(state, { type: 'openBuzzer' }, 'host') as any).state;
      state = (applyEvent(state, { type: 'closeBuzzer' }, 'host') as any).state;
      state = (applyEvent(state, { type: 'moveOn' }, 'host') as any).state;
    }
  }
  // Override scores for FJ scenarios.
  state = { ...state, scores: { ...scores } };
  return state;
}

describe('revealFinalCategory', () => {
  it('host can reveal final category from roundComplete', () => {
    const state = roundCompleteRoom({ p0: 1000, p1: 500 });
    const result = applyEvent(state, { type: 'revealFinalCategory' }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe('finalCategoryShown');
    expect(result.state.finalJeopardy).toEqual({
      wagers: {},
      answers: {},
      submitted: [],
      revealed: [],
    });
  });

  it('non-host cannot reveal final category', () => {
    const state = roundCompleteRoom({ p0: 1000, p1: 500 });
    const result = applyEvent(state, { type: 'revealFinalCategory' }, 'p0');
    expect(result.ok).toBe(false);
  });
});

describe('submitFinalWager', () => {
  it('eligible player (positive score) can submit wager up to their score', () => {
    let state = roundCompleteRoom({ p0: 1000, p1: 500 });
    state = (applyEvent(state, { type: 'revealFinalCategory' }, 'host') as any).state;
    const result = applyEvent(state, { type: 'submitFinalWager', wager: 800 }, 'p0');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.finalJeopardy?.wagers.p0).toBe(800);
  });

  it('rejects wager exceeding score', () => {
    let state = roundCompleteRoom({ p0: 1000, p1: 500 });
    state = (applyEvent(state, { type: 'revealFinalCategory' }, 'host') as any).state;
    const result = applyEvent(state, { type: 'submitFinalWager', wager: 1500 }, 'p0');
    expect(result.ok).toBe(false);
  });

  it('rejects negative wager', () => {
    let state = roundCompleteRoom({ p0: 1000, p1: 500 });
    state = (applyEvent(state, { type: 'revealFinalCategory' }, 'host') as any).state;
    const result = applyEvent(state, { type: 'submitFinalWager', wager: -1 }, 'p0');
    expect(result.ok).toBe(false);
  });

  it('player with score 0 or below cannot wager', () => {
    let state = roundCompleteRoom({ p0: 1000, p1: 0, p2: -200 });
    state = (applyEvent(state, { type: 'revealFinalCategory' }, 'host') as any).state;
    expect(applyEvent(state, { type: 'submitFinalWager', wager: 100 }, 'p1').ok).toBe(false);
    expect(applyEvent(state, { type: 'submitFinalWager', wager: 100 }, 'p2').ok).toBe(false);
  });
});
