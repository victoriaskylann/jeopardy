// === Static game content (bundled JSON) ===

export type Clue = {
  value: number;          // 200, 400, 600, 800, 1000
  clue: string;
  answer: string;
};

export type Category = {
  name: string;
  clues: Clue[];          // exactly 5
};

export type Game = {
  id: string;
  title: string;
  jeopardyRound: {
    categories: Category[];  // exactly 6
  };
  finalJeopardy: {
    category: string;
    clue: string;
    answer: string;
  };
};

// === Runtime room state ===

export type Player = {
  id: string;
  nickname: string;
  connected: boolean;
};

export type BuzzerState =
  | { status: 'closed' }
  | { status: 'open'; openedAt: number }
  | { status: 'locked'; winnerId: string };

export type BoardState = {
  revealed: boolean[][];   // [categoryIdx][clueIdx]
};

export type FinalJeopardyState = {
  wagers: Record<string, number>;
  answers: Record<string, string>;
  submitted: string[];     // playerIds who locked in
  revealed: string[];      // playerIds already shown in reveal stage
};

export type GamePhase =
  | 'lobby'
  | 'selectingClue'
  | 'clueRevealed'
  | 'buzzerOpen'
  | 'judging'
  | 'roundComplete'
  | 'finalCategoryShown'
  | 'finalClueShown'
  | 'finalReveal'
  | 'gameOver';

export type RoomState = {
  phase: GamePhase;
  hostId: string | null;
  players: Player[];
  game: Game | null;
  board: BoardState | null;
  selectedClue: { categoryIdx: number; clueIdx: number } | null;
  buzzer: BuzzerState;
  pickerId: string | null;
  scores: Record<string, number>;
  finalJeopardy: FinalJeopardyState | null;
};

// === Client → server events ===

export type ClientEvent =
  | { type: 'setNickname'; nickname: string }
  | { type: 'claimHost' }
  | { type: 'selectGame'; gameId: string }
  | { type: 'startGame' }
  | { type: 'selectClue'; categoryIdx: number; clueIdx: number }
  | { type: 'openBuzzer' }
  | { type: 'closeBuzzer' }
  | { type: 'buzz' }
  | { type: 'judgeCorrect' }
  | { type: 'judgeWrong' }
  | { type: 'moveOn' }
  | { type: 'revealFinalCategory' }
  | { type: 'submitFinalWager'; wager: number }
  | { type: 'revealFinalClue' }
  | { type: 'submitFinalAnswer'; answer: string }
  | { type: 'revealFinalPlayer'; playerId: string; correct: boolean }
  | { type: 'endGame' }
  | { type: 'kickPlayer'; playerId: string };

// === Server → client events ===

export type ServerEvent =
  | { type: 'state'; state: RoomState }
  | { type: 'youAre'; playerId: string; isHost: boolean }
  | { type: 'error'; message: string };
