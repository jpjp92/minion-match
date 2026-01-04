
export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface Card {
  id: number;
  image: string;
  isFlipped: boolean;
  isMatched: boolean;
  pairId: number;
}

export interface GameState {
  cards: Card[];
  flippedIndices: number[];
  moves: number;
  matches: number;
  status: 'IDLE' | 'PLAYING' | 'WON';
  difficulty: Difficulty;
  bestScore: number;
}

export interface AIComment {
  message: string;
  type: 'MATCH' | 'MISS' | 'WIN' | 'GREETING' | 'STUCK';
}
