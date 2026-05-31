import { z } from 'zod'

export const difficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD'])

export const randomQuerySchema = z.object({
  difficulty: difficultySchema.optional(), // omit to let backend pick randomly
})

export const revealHintBodySchema = z.object({
  puzzleId: z.string().min(1, 'Puzzle ID is required'),
  hintId: z.string().min(1, 'Hint ID is required'),
})

export const submitBodySchema = z.object({
  puzzleId: z.string().min(1, 'Puzzle ID is required'),
  answer: z.string().max(200).default(''),  // empty is valid when timedOut=true
  timeTaken: z.number().int().min(0, 'Time cannot be negative'),
  hintsUsed: z.number().int().min(0).default(0),
  coinsSpentHints: z.number().int().min(0).default(0),
  timedOut: z.boolean().default(false),
})

export const createHintSchema = z.object({
  hintText: z.string().min(1, 'Hint text is required'),
  order: z.number().int().min(1),
  coinCost: z.number().int().min(1),
})

export const createPuzzleBodySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  difficulty: difficultySchema,
  clueText: z.string().min(1, 'Clue text is required'),
  answer: z.string().min(1, 'Answer is required'),
  timeLimit: z.number().int().min(10).optional(), // auto-set from difficulty if omitted
  hints: z.array(createHintSchema).min(1, 'At least one hint is required'),
})

// All fields optional — only provided fields are updated
export const updatePuzzleBodySchema = z.object({
  title:      z.string().min(1).optional(),
  difficulty: difficultySchema.optional(),
  clueText:   z.string().min(1).optional(),
  answer:     z.string().min(1).optional(),
})

export type RandomQuery       = z.infer<typeof randomQuerySchema>
export type RevealHintBody    = z.infer<typeof revealHintBodySchema>
export type SubmitBody        = z.infer<typeof submitBodySchema>
export type CreatePuzzleBody  = z.infer<typeof createPuzzleBodySchema>
export type UpdatePuzzleBody  = z.infer<typeof updatePuzzleBodySchema>
