export type Difficulty = 'easy' | 'medium' | 'hard';

export interface CreateScoreInput {
  playerName: string;
  difficulty: Difficulty;
  score: number;
  win: boolean;
  timeTakenMs: number;
}

export interface UpdateScoreInput {
  playerName?: string;
  difficulty?: Difficulty;
  score?: number;
  win?: boolean;
  timeTakenMs?: number;
}