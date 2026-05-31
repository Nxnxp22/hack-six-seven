export type DifficultyKey = 'EASY' | 'MEDIUM' | 'HARD'

export const STABILITY_DELTA: Record<DifficultyKey, { success: number; failure: number }> = {
  EASY:   { success: 10, failure: -10 },
  MEDIUM: { success: 15, failure: -10 },
  HARD:   { success: 20, failure: -10 },
}

// order 1 → 15 coins, order 2 → 20 coins
export const HINT_COSTS = [15, 20] as const

export const MAX_STABILITY = 100
export const MIN_STABILITY = 0

// Reward more coins for faster completion
// Coins on success: 10 base + up to 30 time bonus → range [10, 40]
export function calcCoinsEarned(timeRemaining: number, timeLimit: number): number {
  const ratio = Math.max(0, Math.min(1, timeRemaining / timeLimit))
  return Math.floor(10 + ratio * 30)
}

// Hint cost by 1-based order (order=1 → 15, order=2+ → 20)
export function hintCost(order: number): number {
  const idx = Math.max(0, order - 1)
  return HINT_COSTS[Math.min(idx, HINT_COSTS.length - 1)]
}
