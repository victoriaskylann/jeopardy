import type { Game } from '../types';
import generalTrivia from './general-trivia.json';

export const GAMES: Game[] = [generalTrivia as Game];

export function getGameById(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}
