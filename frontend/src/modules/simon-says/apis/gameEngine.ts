export type Color = 'red' | 'blue' | 'green' | 'yellow';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GamePhase = 'idle' | 'memorize' | 'replicate' | 'success' | 'fail';

export interface GameConfig {
  difficulty: Difficulty;
  sequenceLength: number;
  flashDurationMs: number;
  flashIntervalMs: number;
  timerSeconds: number;
}

export const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];

export const DIFFICULTY_CONFIG: Record<Difficulty, GameConfig> = {
  easy: {
    difficulty: 'easy',
    sequenceLength: 3,
    flashDurationMs: 800,
    flashIntervalMs: 400,
    timerSeconds: 90,
  },
  medium: {
    difficulty: 'medium',
    sequenceLength: 5,
    flashDurationMs: 500,
    flashIntervalMs: 300,
    timerSeconds: 60,
  },
  hard: {
    difficulty: 'hard',
    sequenceLength: 7,
    flashDurationMs: 300,
    flashIntervalMs: 200,
    timerSeconds: 40,
  },
};

export function generateSequence(length: number): Color[] {
  return Array.from({ length }, () => COLORS[Math.floor(Math.random() * COLORS.length)]);
}

export function checkPartialInput(sequence: Color[], inputs: Color[]): 'correct' | 'wrong' | 'incomplete' {
  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i] !== sequence[i]) return 'wrong';
  }
  if (inputs.length === sequence.length) return 'correct';
  return 'incomplete';
}

export function calculateScore(difficulty: Difficulty, timeTakenMs: number, win: boolean): number {
  if (!win) return 0;
  const base = { easy: 100, medium: 250, hard: 500 }[difficulty];
  const config = DIFFICULTY_CONFIG[difficulty];
  const timeBonus = Math.max(0, config.timerSeconds * 1000 - timeTakenMs);
  return Math.round(base + timeBonus / 100);
}