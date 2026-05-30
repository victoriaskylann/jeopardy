import { describe, it, expect } from 'vitest';
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
    // Per-clue state resets on selection.
    expect(result.state.typedAnswers).toEqual([]);
    expect(result.state.answerRevealed).toBe(false);
    expect(result.state.clueJudgment).toBeNull();
  });

  it('non-picker cannot select', () => {
    const result = applyEvent(startedRoom(), { type: 'selectClue', categoryIdx: 0, clueIdx: 0 }, 'p1');
    expect(result.ok).toBe(false);
  });

  it('cannot select already-revealed clue', () => {
    let state = startedRoom();
    state = (applyEvent(state, { type: 'selectClue', categoryIdx: 0, clueIdx: 0 }, 'p0') as any).state;
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

  it('cannot open buzzer outside clueRevealed', () => {
    const result = applyEvent(startedRoom(), { type: 'openBuzzer' }, 'host');
    expect(result.ok).toBe(false);
  });

  it('reopen buzzer from judging is rejected (the typed-answer flow replaces reopen)', () => {
    let state = openBuzzerRoom();
    state = (applyEvent(state, { type: 'buzz' }, 'p1') as any).state;
    state = (applyEvent(state, { type: 'revealAnswer' }, 'host') as any).state;
    state = (applyEvent(state, { type: 'judgeWrong' }, 'host') as any).state;
    const result = applyEvent(state, { type: 'openBuzzer' }, 'host');
    expect(result.ok).toBe(false);
  });
});

function openBuzzerRoom(): RoomState {
  let state = startedRoom();
  state = (applyEvent(state, { type: 'selectClue', categoryIdx: 0, clueIdx: 0 }, 'p0') as any).state;
  state = (applyEvent(state, { type: 'openBuzzer' }, 'host') as any).state;
  return state;
}

function buzzedRoom(buzzerId = 'p1'): RoomState {
  let state = openBuzzerRoom();
  state = (applyEvent(state, { type: 'buzz' }, buzzerId) as any).state;
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

describe('submitTypedAnswer', () => {
  it('non-buzzed player can type an answer', () => {
    const state = buzzedRoom('p1');
    const result = applyEvent(state, { type: 'submitTypedAnswer', answer: 'Paris' }, 'p2');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.typedAnswers).toEqual([{ playerId: 'p2', answer: 'Paris' }]);
  });

  it('buzzed-in player cannot type (answering verbally)', () => {
    const state = buzzedRoom('p1');
    const result = applyEvent(state, { type: 'submitTypedAnswer', answer: 'cheat' }, 'p1');
    expect(result.ok).toBe(false);
  });

  it('subsequent submission overwrites previous answer from same player', () => {
    let state = buzzedRoom('p1');
    state = (applyEvent(state, { type: 'submitTypedAnswer', answer: 'first' }, 'p2') as any).state;
    state = (applyEvent(state, { type: 'submitTypedAnswer', answer: 'second' }, 'p2') as any).state;
    expect(state.typedAnswers).toEqual([{ playerId: 'p2', answer: 'second' }]);
  });

  it('rejected after host reveals the answer', () => {
    let state = buzzedRoom('p1');
    state = (applyEvent(state, { type: 'revealAnswer' }, 'host') as any).state;
    const result = applyEvent(state, { type: 'submitTypedAnswer', answer: 'too late' }, 'p2');
    expect(result.ok).toBe(false);
  });

  it('rejected before any buzz', () => {
    const result = applyEvent(openBuzzerRoom(), { type: 'submitTypedAnswer', answer: 'x' }, 'p2');
    expect(result.ok).toBe(false);
  });
});

describe('revealAnswer', () => {
  it('host can reveal during judging', () => {
    const state = buzzedRoom();
    const result = applyEvent(state, { type: 'revealAnswer' }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.answerRevealed).toBe(true);
  });

  it('non-host cannot reveal', () => {
    const state = buzzedRoom();
    const result = applyEvent(state, { type: 'revealAnswer' }, 'p0');
    expect(result.ok).toBe(false);
  });

  it('cannot reveal twice', () => {
    let state = buzzedRoom();
    state = (applyEvent(state, { type: 'revealAnswer' }, 'host') as any).state;
    const result = applyEvent(state, { type: 'revealAnswer' }, 'host');
    expect(result.ok).toBe(false);
  });
});

describe('judgeCorrect', () => {
  it('rejected before revealAnswer', () => {
    const state = buzzedRoom('p1');
    const result = applyEvent(state, { type: 'judgeCorrect' }, 'host');
    expect(result.ok).toBe(false);
  });

  it('after reveal: adds clue value to winner, makes them picker, stays in judging', () => {
    let state = buzzedRoom('p1');
    state = (applyEvent(state, { type: 'revealAnswer' }, 'host') as any).state;
    const result = applyEvent(state, { type: 'judgeCorrect' }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe('judging');
    expect(result.state.scores.p1).toBe(200);
    expect(result.state.pickerId).toBe('p1');
    expect(result.state.clueJudgment).toBe('correct');
  });

  it('non-host cannot judge', () => {
    let state = buzzedRoom('p1');
    state = (applyEvent(state, { type: 'revealAnswer' }, 'host') as any).state;
    const result = applyEvent(state, { type: 'judgeCorrect' }, 'p0');
    expect(result.ok).toBe(false);
  });

  it('cannot judge twice', () => {
    let state = buzzedRoom('p1');
    state = (applyEvent(state, { type: 'revealAnswer' }, 'host') as any).state;
    state = (applyEvent(state, { type: 'judgeCorrect' }, 'host') as any).state;
    const result = applyEvent(state, { type: 'judgeWrong' }, 'host');
    expect(result.ok).toBe(false);
  });
});

describe('judgeWrong', () => {
  it('rejected before revealAnswer', () => {
    const state = buzzedRoom('p1');
    const result = applyEvent(state, { type: 'judgeWrong' }, 'host');
    expect(result.ok).toBe(false);
  });

  it('after reveal: subtracts clue value, closes buzzer, stays in judging', () => {
    let state = buzzedRoom('p1');
    state = (applyEvent(state, { type: 'revealAnswer' }, 'host') as any).state;
    const result = applyEvent(state, { type: 'judgeWrong' }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe('judging');
    expect(result.state.scores.p1).toBe(-200);
    expect(result.state.buzzer).toEqual({ status: 'closed' });
    expect(result.state.clueJudgment).toBe('wrong');
  });

  it('scores can go negative', () => {
    let state = buzzedRoom('p1');
    state = (applyEvent(state, { type: 'revealAnswer' }, 'host') as any).state;
    state = (applyEvent(state, { type: 'judgeWrong' }, 'host') as any).state;
    expect(state.scores.p1).toBe(-200);
  });
});

describe('awardTypedAnswer', () => {
  function readyToAward(): RoomState {
    let state = buzzedRoom('p1');
    state = (applyEvent(state, { type: 'submitTypedAnswer', answer: 'Paris' }, 'p2') as any).state;
    state = (applyEvent(state, { type: 'revealAnswer' }, 'host') as any).state;
    state = (applyEvent(state, { type: 'judgeWrong' }, 'host') as any).state;
    return state;
  }

  it('host can award typed answer; awarded player gets +value, becomes picker, clue ends', () => {
    const state = readyToAward();
    const result = applyEvent(state, { type: 'awardTypedAnswer', playerId: 'p2' }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe('selectingClue');
    expect(result.state.scores.p2).toBe(200);
    expect(result.state.pickerId).toBe('p2');
  });

  it('non-host cannot award', () => {
    const state = readyToAward();
    const result = applyEvent(state, { type: 'awardTypedAnswer', playerId: 'p2' }, 'p2');
    expect(result.ok).toBe(false);
  });

  it('cannot award if buzzer-in was correct', () => {
    let state = buzzedRoom('p1');
    state = (applyEvent(state, { type: 'submitTypedAnswer', answer: 'Paris' }, 'p2') as any).state;
    state = (applyEvent(state, { type: 'revealAnswer' }, 'host') as any).state;
    state = (applyEvent(state, { type: 'judgeCorrect' }, 'host') as any).state;
    const result = applyEvent(state, { type: 'awardTypedAnswer', playerId: 'p2' }, 'host');
    expect(result.ok).toBe(false);
  });

  it('cannot award a player who did not type', () => {
    const state = readyToAward();
    const result = applyEvent(state, { type: 'awardTypedAnswer', playerId: 'p0' }, 'host');
    expect(result.ok).toBe(false);
  });
});

describe('moveOn', () => {
  it('after correct: ends clue with winner as picker', () => {
    let state = buzzedRoom('p1');
    state = (applyEvent(state, { type: 'revealAnswer' }, 'host') as any).state;
    state = (applyEvent(state, { type: 'judgeCorrect' }, 'host') as any).state;
    const result = applyEvent(state, { type: 'moveOn' }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe('selectingClue');
    expect(result.state.pickerId).toBe('p1');
  });

  it('after wrong without award: ends clue, original picker keeps the pick', () => {
    let state = buzzedRoom('p1');
    state = (applyEvent(state, { type: 'revealAnswer' }, 'host') as any).state;
    state = (applyEvent(state, { type: 'judgeWrong' }, 'host') as any).state;
    const result = applyEvent(state, { type: 'moveOn' }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe('selectingClue');
    expect(result.state.pickerId).toBe('p0');
    expect(result.state.buzzer.status).toBe('closed');
  });

  it('non-host cannot moveOn', () => {
    let state = buzzedRoom('p1');
    state = (applyEvent(state, { type: 'revealAnswer' }, 'host') as any).state;
    state = (applyEvent(state, { type: 'judgeWrong' }, 'host') as any).state;
    const result = applyEvent(state, { type: 'moveOn' }, 'p0');
    expect(result.ok).toBe(false);
  });
});

describe('closeBuzzer (no one buzzed)', () => {
  it('host can close buzzer; auto-reveals answer for the room', () => {
    const state = openBuzzerRoom();
    const result = applyEvent(state, { type: 'closeBuzzer' }, 'host');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe('judging');
    expect(result.state.buzzer.status).toBe('closed');
    expect(result.state.answerRevealed).toBe(true);
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
