import type { Game } from '../types';
import generalTrivia from './general-trivia.json';
import nineties from './90s-pop-culture.json';
import science from './science-and-nature.json';
import babyEdition from './baby-edition.json';

export const GAMES: Game[] = [
  generalTrivia as Game,
  nineties as Game,
  science as Game,
  babyEdition as Game,
];

export function getGameById(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}
