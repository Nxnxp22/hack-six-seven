export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

export interface HintMetadata {
  id: string
  order: number
  coinCost: number
}

export interface PuzzlePublicDTO {
  id: string
  title: string
  difficulty: Difficulty
  clueText: string
  timeLimit: number
  hints: HintMetadata[]
}

export interface GameStateDTO {
  securityStability: number
  powerStability: number
  reactorStability: number
  communicationStability: number
  globalStability: number
  coins: number
}

export interface RevealHintRequestDTO {
  puzzleId: string
  hintId: string
}

export interface RevealHintResponseDTO {
  hintText: string
  coinCost: number
  coinsRemaining: number
}

export interface SubmitRequestDTO {
  puzzleId: string
  answer: string
  timeTaken: number
  hintsUsed: number
  coinsSpentHints: number
  timedOut?: boolean
}

export interface SubmitResponseDTO {
  correct: boolean
  stabilityChange: number
  coinsChange: number
  currentCoins: number
  securityStability: number
  globalStability: number
  timeTaken: number
  hintsUsed: number
  coinsSpentHints: number
}
