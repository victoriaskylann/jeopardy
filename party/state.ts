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
    case 'selectClue':
      return handleSelectClue(state, event.categoryIdx, event.clueIdx, senderId);
    case 'openBuzzer':
      return handleOpenBuzzer(state, senderId);
    case 'buzz':
      return handleBuzz(state, senderId);
    case 'judgeCorrect':
      return handleJudge(state, true, senderId);
    case 'judgeWrong':
      return handleJudge(state, false, senderId);
    case 'moveOn':
      return handleMoveOn(state, senderId);
    case 'closeBuzzer':
      return handleCloseBuzzer(state, senderId);
    case 'revealFinalCategory':
      return handleRevealFinalCategory(state, senderId);
    case 'submitFinalWager':
      return handleSubmitFinalWager(state, event.wager, senderId);
    case 'revealFinalClue':
      return handleRevealFinalClue(state, senderId);
    case 'submitFinalAnswer':
      return handleSubmitFinalAnswer(state, event.answer, senderId);
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

function handleSelectClue(state: RoomState, categoryIdx: number, clueIdx: number, senderId: string): ApplyResult {
  if (state.phase !== 'selectingClue') return { ok: false, error: 'Not in selecting phase' };
  if (state.pickerId !== senderId) return { ok: false, error: 'Not your turn to pick' };
  if (!state.board || !state.game) return { ok: false, error: 'No board' };
  if (categoryIdx < 0 || categoryIdx >= 6 || clueIdx < 0 || clueIdx >= 5) {
    return { ok: false, error: 'Invalid clue coordinates' };
  }
  if (state.board.revealed[categoryIdx][clueIdx]) return { ok: false, error: 'Clue already played' };

  const revealed = state.board.revealed.map((row) => [...row]);
  revealed[categoryIdx][clueIdx] = true;
  return {
    ok: true,
    state: {
      ...state,
      phase: 'clueRevealed',
      selectedClue: { categoryIdx, clueIdx },
      board: { revealed },
    },
  };
}

function handleOpenBuzzer(state: RoomState, senderId: string): ApplyResult {
  if (state.hostId !== senderId) return { ok: false, error: 'Only host' };
  if (state.phase !== 'clueRevealed' && state.phase !== 'judging') {
    return { ok: false, error: 'Cannot open buzzer in current phase' };
  }
  return {
    ok: true,
    state: { ...state, phase: 'buzzerOpen', buzzer: { status: 'open', openedAt: Date.now() } },
  };
}

function handleBuzz(state: RoomState, senderId: string): ApplyResult {
  if (state.phase !== 'buzzerOpen') return { ok: false, error: 'Buzzer not open' };
  const player = state.players.find((p) => p.id === senderId);
  if (!player) return { ok: false, error: 'Not a player' };
  return {
    ok: true,
    state: {
      ...state,
      phase: 'judging',
      buzzer: { status: 'locked', winnerId: senderId },
    },
  };
}

function getClueValue(state: RoomState): number {
  if (!state.game || !state.selectedClue) return 0;
  const { categoryIdx, clueIdx } = state.selectedClue;
  return state.game.jeopardyRound.categories[categoryIdx].clues[clueIdx].value;
}

function handleJudge(state: RoomState, correct: boolean, senderId: string): ApplyResult {
  if (state.hostId !== senderId) return { ok: false, error: 'Only host' };
  if (state.phase !== 'judging') return { ok: false, error: 'Not in judging phase' };
  if (state.buzzer.status !== 'locked') return { ok: false, error: 'No buzz to judge' };
  const winnerId = state.buzzer.winnerId;
  const value = getClueValue(state);
  const newScore = (state.scores[winnerId] ?? 0) + (correct ? value : -value);
  const scores = { ...state.scores, [winnerId]: newScore };

  if (correct) {
    return endClue(state, scores, winnerId);
  }
  // Wrong: stay in judging; host chooses openBuzzer (reopen) or moveOn.
  return { ok: true, state: { ...state, scores } };
}

function handleMoveOn(state: RoomState, senderId: string): ApplyResult {
  if (state.hostId !== senderId) return { ok: false, error: 'Only host' };
  if (state.phase !== 'judging') return { ok: false, error: 'Not in judging phase' };
  return endClue(state, state.scores, state.pickerId);
}

function handleCloseBuzzer(state: RoomState, senderId: string): ApplyResult {
  if (state.hostId !== senderId) return { ok: false, error: 'Only host' };
  if (state.phase !== 'buzzerOpen') return { ok: false, error: 'Buzzer not open' };
  return {
    ok: true,
    state: {
      ...state,
      phase: 'judging',
      buzzer: { status: 'closed' },
    },
  };
}

function handleRevealFinalCategory(state: RoomState, senderId: string): ApplyResult {
  if (state.hostId !== senderId) return { ok: false, error: 'Only host' };
  if (state.phase !== 'roundComplete') return { ok: false, error: 'Round not complete' };
  return {
    ok: true,
    state: {
      ...state,
      phase: 'finalCategoryShown',
      finalJeopardy: { wagers: {}, answers: {}, submitted: [], revealed: [] },
    },
  };
}

function handleSubmitFinalWager(state: RoomState, wager: number, senderId: string): ApplyResult {
  if (state.phase !== 'finalCategoryShown') return { ok: false, error: 'Not accepting wagers' };
  if (!state.finalJeopardy) return { ok: false, error: 'Final Jeopardy not initialized' };
  const score = state.scores[senderId];
  if (score === undefined) return { ok: false, error: 'Not a player' };
  if (score <= 0) return { ok: false, error: 'Score must be positive to wager' };
  if (!Number.isFinite(wager) || wager < 0 || wager > score) {
    return { ok: false, error: 'Wager must be between 0 and your current score' };
  }
  return {
    ok: true,
    state: {
      ...state,
      finalJeopardy: {
        ...state.finalJeopardy,
        wagers: { ...state.finalJeopardy.wagers, [senderId]: wager },
      },
    },
  };
}

function eligibleForFinal(state: RoomState): string[] {
  return state.players.filter((p) => (state.scores[p.id] ?? 0) > 0).map((p) => p.id);
}

function handleRevealFinalClue(state: RoomState, senderId: string): ApplyResult {
  if (state.hostId !== senderId) return { ok: false, error: 'Only host' };
  if (state.phase !== 'finalCategoryShown') return { ok: false, error: 'Not awaiting reveal' };
  if (!state.finalJeopardy) return { ok: false, error: 'No final state' };
  const eligible = eligibleForFinal(state);
  for (const id of eligible) {
    if (state.finalJeopardy.wagers[id] === undefined) {
      return { ok: false, error: 'Not all eligible players have wagered' };
    }
  }
  return { ok: true, state: { ...state, phase: 'finalClueShown' } };
}

function handleSubmitFinalAnswer(state: RoomState, answer: string, senderId: string): ApplyResult {
  if (state.phase !== 'finalClueShown') return { ok: false, error: 'Not accepting answers' };
  if (!state.finalJeopardy) return { ok: false, error: 'No final state' };
  const eligible = eligibleForFinal(state);
  if (!eligible.includes(senderId)) return { ok: false, error: 'Not eligible' };

  const submitted = state.finalJeopardy.submitted.includes(senderId)
    ? state.finalJeopardy.submitted
    : [...state.finalJeopardy.submitted, senderId];
  const newFj = {
    ...state.finalJeopardy,
    answers: { ...state.finalJeopardy.answers, [senderId]: answer },
    submitted,
  };
  const allSubmitted = eligible.every((id) => submitted.includes(id));
  return {
    ok: true,
    state: {
      ...state,
      phase: allSubmitted ? 'finalReveal' : state.phase,
      finalJeopardy: newFj,
    },
  };
}

function endClue(state: RoomState, scores: Record<string, number>, nextPicker: string | null): ApplyResult {
  const allRevealed = state.board?.revealed.every((row) => row.every((r) => r));
  if (allRevealed) {
    return {
      ok: true,
      state: {
        ...state,
        phase: 'roundComplete',
        buzzer: { status: 'closed' },
        selectedClue: null,
        scores,
        pickerId: null,
      },
    };
  }
  return {
    ok: true,
    state: {
      ...state,
      phase: 'selectingClue',
      buzzer: { status: 'closed' },
      selectedClue: null,
      scores,
      pickerId: nextPicker,
    },
  };
}
