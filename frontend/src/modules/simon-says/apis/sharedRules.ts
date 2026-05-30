export interface GameRuleConfig {
  stability: {
    success: {
      easy: number;
      medium: number;
      hard: number;
    };
    failure: number;
  };
  hints: {
    cost: number[]; // Index 0 = Hint #1, Index 1 = Hint #2
  };
}

export const SHARED_GAME_RULES: GameRuleConfig = {
  stability: {
    success: {
      easy: 10,
      medium: 15,
      hard: 20,
    },
    failure: -10,
  },
  hints: {
    cost: [15, 20],
  },
};

/**
 * Consistent coins formula based on completion time from the official specification:
 * Success: 10 + floor((timeRemaining / timeLimit) * 30) -> range 10-40
 * Failure: 0
 * @param difficulty 'easy' | 'medium' | 'hard'
 * @param timeTakenMs Completion time in milliseconds
 * @param timerSeconds Total available time in seconds (timeLimit)
 * @param win Whether the player won
 */
export function calculateCoinsReward(
  difficulty: 'easy' | 'medium' | 'hard',
  timeTakenMs: number,
  timerSeconds: number,
  win: boolean
): number {
  if (!win) return 0;
  
  const timeTakenSeconds = timeTakenMs / 1000;
  const timeRemaining = Math.max(0, timerSeconds - timeTakenSeconds);
  
  // Official spec formula: 10 + floor((timeRemaining / timeLimit) * 30)
  const coins = 10 + Math.floor((timeRemaining / timerSeconds) * 30);
  
  // Clamped strictly to the 10 - 40 range as per spec
  return Math.min(40, Math.max(10, coins));
}

/**
 * Calculates stability change based on difficulty and outcome.
 */
export function calculateStabilityChange(
  difficulty: 'easy' | 'medium' | 'hard',
  win: boolean
): number {
  if (!win) return SHARED_GAME_RULES.stability.failure;
  return SHARED_GAME_RULES.stability.success[difficulty] || 15;
}
