import type { NextFunction, Request, Response } from 'express'
import {
  createPuzzleBodySchema,
  randomQuerySchema,
  revealHintBodySchema,
  submitBodySchema,
  updatePuzzleBodySchema,
} from '../validators/passwordPuzzle.validator'
import * as service from '../services/passwordPuzzle.service'

// GET /api/password-puzzle/stability
export async function getStability(_req: Request, res: Response, next: NextFunction) {
  try {
    const state = await service.getGameState()
    res.json(state)
  } catch (err) {
    next(err)
  }
}

// GET /api/password-puzzle/random?difficulty=EASY  (difficulty optional — omit for random)
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

// POST /api/password-puzzle
export async function createPuzzle(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createPuzzleBodySchema.parse(req.body)
    const puzzle = await service.createPuzzle(body)
    res.status(201).json(puzzle)
  } catch (err) {
    next(err)
  }
}

// GET /api/password-puzzle
export async function getAll(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getAllPuzzles())
  } catch (err) {
    next(err)
  }
}

// GET /api/password-puzzle/:id
export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getPuzzleById(req.params.id as string))
  } catch (err) {
    next(err)
  }
}

// PATCH /api/password-puzzle/:id
export async function updatePuzzle(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updatePuzzleBodySchema.parse(req.body)
    res.json(await service.updatePuzzle(req.params.id as string, body))
  } catch (err) {
    next(err)
  }
}

// DELETE /api/password-puzzle/:id
export async function deletePuzzle(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deletePuzzle(req.params.id as string)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
