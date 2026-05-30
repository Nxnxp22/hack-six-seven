import type { NextFunction, Request, Response } from 'express'
import { randomQuerySchema, revealHintBodySchema, submitBodySchema } from '../validators/passwordPuzzle.validator'
import * as service from '../services/passwordPuzzle.service'

// GET /api/password-puzzle/random?difficulty=EASY
export async function getRandom(req: Request, res: Response, next: NextFunction) {
  try {
    const { difficulty } = randomQuerySchema.parse(req.query)
    const puzzle = await service.getRandomPuzzle(difficulty)
    res.json(puzzle)
  } catch (err) {
    next(err)
  }
}

// POST /api/password-puzzle/hint
export async function revealHint(req: Request, res: Response, next: NextFunction) {
  try {
    const { puzzleId, hintId } = revealHintBodySchema.parse(req.body)
    const result = await service.revealHint(puzzleId, hintId)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

// POST /api/password-puzzle/submit
export async function submit(req: Request, res: Response, next: NextFunction) {
  try {
    const body = submitBodySchema.parse(req.body)
    const result = await service.submitAnswer(body)
    res.json(result)
  } catch (err) {
    next(err)
  }
}
