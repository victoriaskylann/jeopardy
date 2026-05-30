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

function openBuzzerRoom(): RoomState {
  let state = startedRoom();
  state = (applyEvent(state, { type: 'selectClue', categoryIdx: 0, clueIdx: 0 }, 'p0') as any).state;
  state = (applyEvent(state, { type: 'openBuzzer' }, 'host') as any).state;
  return state;
}

describe('buzz', () => {
  it('first buzz wins and transitions to judging', () => {
    const result = applyEvent(openBuzzerRoom(), { type: 'buzz' }, 'p1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe('judging');
    expect(result.state.buzzer).toEqual({ status: 'locked', winnerId: 'p1' });
  });

  it('second buzz is ignored once locked', () => {
    let state = openBuzzerRoom();
    state = (applyEvent(state, { type: 'buzz' }, 'p1') as any).state;
    const result = applyEvent(state, { type: 'buzz' }, 'p2');
    expect(result.ok).toBe(false);
  });

  it('cannot buzz outside buzzerOpen', () => {
    const result = applyEvent(startedRoom(), { type: 'buzz' }, 'p0');
    expect(result.ok).toBe(false);
  });
});

describe('judgeCorrect', () => {
  it('adds clue value to winner, makes them picker, returns to selectingClue', () => {
    let state = openBuzzerRoom();
    state = (applyEvent(state, { type: 'buzz' }, 'p1') as any).state;
    const result = applyEvent(state, { type: 'judgeCorrect' }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe('selectingClue');
    expect(result.state.scores.p1).toBe(200);
    expect(result.state.pickerId).toBe('p1');
    expect(result.state.buzzer).toEqual({ status: 'closed' });
    expect(result.state.selectedClue).toBeNull();
  });

  it('non-host cannot judge', () => {
    let state = openBuzzerRoom();
    state = (applyEvent(state, { type: 'buzz' }, 'p1') as any).state;
    const result = applyEvent(state, { type: 'judgeCorrect' }, 'p0');
    expect(result.ok).toBe(false);
  });
});

describe('judgeWrong', () => {
  it('subtracts clue value from winner and stays in judging', () => {
    let state = openBuzzerRoom();
    state = (applyEvent(state, { type: 'buzz' }, 'p1') as any).state;
    const result = applyEvent(state, { type: 'judgeWrong' }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe('judging');
    expect(result.state.scores.p1).toBe(-200);
    // Buzzer unlocks so the host's UI flips from Correct/Wrong to Reopen/Move On.
    expect(result.state.buzzer).toEqual({ status: 'closed' });
  });

  it('scores can go negative', () => {
    let state = openBuzzerRoom();
    state = (applyEvent(state, { type: 'buzz' }, 'p1') as any).state;
    state = (applyEvent(state, { type: 'judgeWrong' }, 'host') as any).state;
    expect(state.scores.p1).toBe(-200);
  });

  it('reopen buzzer after wrong allows another buzz', () => {
    let state = openBuzzerRoom();
    state = (applyEvent(state, { type: 'buzz' }, 'p1') as any).state;
    state = (applyEvent(state, { type: 'judgeWrong' }, 'host') as any).state;
    state = (applyEvent(state, { type: 'openBuzzer' }, 'host') as any).state;
    expect(state.phase).toBe('buzzerOpen');
    expect(state.buzzer.status).toBe('open');
    const result = applyEvent(state, { type: 'buzz' }, 'p2');
    expect(result.ok).toBe(true);
  });
});

describe('moveOn', () => {
  it('from judging after wrong: returns to selectingClue, picker unchanged', () => {
    let state = openBuzzerRoom();
    state = (applyEvent(state, { type: 'buzz' }, 'p1') as any).state;
    state = (applyEvent(state, { type: 'judgeWrong' }, 'host') as any).state;
    const result = applyEvent(state, { type: 'moveOn' }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe('selectingClue');
    expect(result.state.pickerId).toBe('p0'); // original picker
    expect(result.state.buzzer.status).toBe('closed');
  });

  it('non-host cannot moveOn', () => {
    let state = openBuzzerRoom();
    state = (applyEvent(state, { type: 'buzz' }, 'p1') as any).state;
    state = (applyEvent(state, { type: 'judgeWrong' }, 'host') as any).state;
    const result = applyEvent(state, { type: 'moveOn' }, 'p0');
    expect(result.ok).toBe(false);
  });
});

describe('closeBuzzer (no one buzzed)', () => {
  it('host can close buzzer; goes to judging so answer can be revealed', () => {
    const state = openBuzzerRoom();
    const result = applyEvent(state, { type: 'closeBuzzer' }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe('judging');
    expect(result.state.buzzer.status).toBe('closed');
  });

  it('moveOn from a no-buzz judging keeps picker', () => {
    let state = openBuzzerRoom();
    state = (applyEvent(state, { type: 'closeBuzzer' }, 'host') as any).state;
    const result = applyEvent(state, { type: 'moveOn' }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.pickerId).toBe('p0');
    expect(result.state.phase).toBe('selectingClue');
  });
});

describe('round completion', () => {
  it('after all 30 clues are played, ending a clue transitions to roundComplete', () => {
    // Play every clue. For brevity, just brute-force advance the board.
    let state = startedRoom(2);
    for (let cat = 0; cat < 6; cat++) {
      for (let clue = 0; clue < 5; clue++) {
        state = (applyEvent(state, { type: 'selectClue', categoryIdx: cat, clueIdx: clue }, state.pickerId!) as any).state;
        state = (applyEvent(state, { type: 'openBuzzer' }, 'host') as any).state;
        state = (applyEvent(state, { type: 'closeBuzzer' }, 'host') as any).state;
        state = (applyEvent(state, { type: 'moveOn' }, 'host') as any).state;
      }
    }
    expect(state.phase).toBe('roundComplete');
  });
});
