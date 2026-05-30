import { z } from 'zod'

export const difficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD'])

export const randomQuerySchema = z.object({
  difficulty: difficultySchema.default('EASY'),
})

export const revealHintBodySchema = z.object({
  puzzleId: z.string().min(1, 'Puzzle ID is required'),
  hintId: z.string().min(1, 'Hint ID is required'),
})

export const submitBodySchema = z.object({
  puzzleId: z.string().min(1, 'Puzzle ID is required'),
  answer: z.string().min(1, 'Answer is required').max(200, 'Answer too long'),
  timeTaken: z.number().int().min(0, 'Time cannot be negative'),
  hintsUsed: z.number().int().min(0).default(0),
  coinsSpentHints: z.number().int().min(0).default(0),
})

export type RandomQuery = z.infer<typeof randomQuerySchema>
export type RevealHintBody = z.infer<typeof revealHintBodySchema>
export type SubmitBody = z.infer<typeof submitBodySchema>
