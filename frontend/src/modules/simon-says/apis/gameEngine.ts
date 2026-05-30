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
    timerSeconds: 30,
  },
  medium: {
    difficulty: 'medium',
    sequenceLength: 5,
    flashDurationMs: 500,
    flashIntervalMs: 300,
    timerSeconds: 20,
  },
  hard: {
    difficulty: 'hard',
    sequenceLength: 7,
    flashDurationMs: 300,
    flashIntervalMs: 200,
    timerSeconds: 15,
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

import { calculateCoinsReward } from './sharedRules';

export function calculateScore(difficulty: Difficulty, timeTakenMs: number, win: boolean): number {
  const timerSeconds = DIFFICULTY_CONFIG[difficulty]?.timerSeconds || 60;
  return calculateCoinsReward(difficulty, timeTakenMs, timerSeconds, win);
}