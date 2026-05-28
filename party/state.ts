import type { RoomState } from '../src/types';

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
