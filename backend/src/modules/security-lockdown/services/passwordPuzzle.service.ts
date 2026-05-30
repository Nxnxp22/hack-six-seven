import { prisma } from '../../../db'
import { AppError } from '../../../shared/errors'
import type {
  Difficulty,
  GameStateDTO,
  PuzzlePublicDTO,
  RevealHintResponseDTO,
  SubmitResponseDTO,
} from '../types/passwordPuzzle.types'
import type { CreatePuzzleBody, SubmitBody, UpdatePuzzleBody } from '../validators/passwordPuzzle.validator'

// Game balance constants
const COINS_ON_SUCCESS    = 20
const STABILITY_ON_SUCCESS = 10
const STABILITY_ON_FAILURE = -10
const MAX_STABILITY        = 100
const MIN_STABILITY        = 0

// Time limits by difficulty (seconds)
const TIME_LIMITS: Record<string, number> = {
  EASY:   120,
  MEDIUM:  90,
  HARD:    60,
}

const ALL_DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD']

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getOrCreateGameState() {
  const state = await prisma.gameState.findFirst()
  if (state) return state
  return prisma.gameState.create({ data: {} })
}

function calcGlobalStability(state: {
  securityStability: number
  powerStability: number
  reactorStability: number
  communicationStability: number
}): number {
  return Math.round(
    (state.securityStability + state.powerStability + state.reactorStability + state.communicationStability) / 4,
  )
}

function toGameStateDTO(state: Awaited<ReturnType<typeof getOrCreateGameState>>): GameStateDTO {
  return {
    securityStability:      state.securityStability,
    powerStability:         state.powerStability,
    reactorStability:       state.reactorStability,
    communicationStability: state.communicationStability,
    globalStability:        calcGlobalStability(state),
    coins:                  state.coins,
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

// Returns current game state (stability values + coins)
export async function getGameState(): Promise<GameStateDTO> {
  const state = await getOrCreateGameState()
  return toGameStateDTO(state)
}

// Returns a random puzzle — difficulty is auto-selected if not provided
export async function getRandomPuzzle(difficulty?: Difficulty): Promise<PuzzlePublicDTO> {
  const selectedDifficulty =
    difficulty ?? ALL_DIFFICULTIES[Math.floor(Math.random() * ALL_DIFFICULTIES.length)]

  const count = await prisma.passwordPuzzle.count({ where: { difficulty: selectedDifficulty } })
  if (count === 0) {
    throw new AppError(`No puzzles available for difficulty: ${selectedDifficulty}`, 404)
  }

  const skip = Math.floor(Math.random() * count)
  const puzzle = await prisma.passwordPuzzle.findFirst({
    where: { difficulty: selectedDifficulty },
    skip,
    include: {
      hints: {
        select: { id: true, order: true, coinCost: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!puzzle) throw new AppError('Puzzle not found', 404)

  return {
    id:         puzzle.id,
    title:      puzzle.title,
    difficulty: puzzle.difficulty as Difficulty,
    clueText:   puzzle.clueText,
    timeLimit:  puzzle.timeLimit,
    hints:      puzzle.hints,
  }
}

// Deducts coins and returns hint text
export async function revealHint(puzzleId: string, hintId: string): Promise<RevealHintResponseDTO> {
  const hint = await prisma.puzzleHint.findFirst({ where: { id: hintId, puzzleId } })
  if (!hint) throw new AppError('Hint not found', 404)

  const gameState = await getOrCreateGameState()
  if (gameState.coins < hint.coinCost) {
    throw new AppError(`Insufficient coins — need ${hint.coinCost}, have ${gameState.coins}`, 400)
  }

  const updated = await prisma.gameState.update({
    where: { id: gameState.id },
    data: { coins: { decrement: hint.coinCost } },
  })

  return { hintText: hint.hintText, coinCost: hint.coinCost, coinsRemaining: updated.coins }
}

// Validates answer, updates security stability + coins, records attempt
export async function submitAnswer(body: SubmitBody): Promise<SubmitResponseDTO> {
  const puzzle = await prisma.passwordPuzzle.findUnique({ where: { id: body.puzzleId } })
  if (!puzzle) throw new AppError('Puzzle not found', 404)

  const correct = body.timedOut
    ? false
    : puzzle.answer.trim().toLowerCase() === body.answer.trim().toLowerCase()

  const stabilityDelta = correct ? STABILITY_ON_SUCCESS : STABILITY_ON_FAILURE
  const coinsDelta      = correct ? COINS_ON_SUCCESS     : 0

  const gameState = await getOrCreateGameState()

  const newSecurity = Math.max(MIN_STABILITY, Math.min(MAX_STABILITY, gameState.securityStability + stabilityDelta))
  const newCoins    = Math.max(0, gameState.coins + coinsDelta)

  const [updatedState] = await prisma.$transaction([
    prisma.gameState.update({
      where: { id: gameState.id },
      data: { securityStability: newSecurity, coins: newCoins },
    }),
    prisma.puzzleAttempt.create({
      data: {
        puzzleId:       body.puzzleId,
        correct,
        timeTaken:      body.timeTaken,
        hintsUsed:      body.hintsUsed,
        coinsSpentHints: body.coinsSpentHints,
        coinsChange:    coinsDelta,
        stabilityChange: stabilityDelta,
      },
    }),
  ])

  return {
    correct,
    stabilityChange:   stabilityDelta,
    coinsChange:       coinsDelta,
    currentCoins:      updatedState.coins,
    securityStability: updatedState.securityStability,
    globalStability:   calcGlobalStability(updatedState),
    timeTaken:         body.timeTaken,
    hintsUsed:         body.hintsUsed,
    coinsSpentHints:   body.coinsSpentHints,
  }
}

// Creates a puzzle — timeLimit auto-set from difficulty if omitted
export async function createPuzzle(body: CreatePuzzleBody) {
  const { hints, timeLimit, ...puzzleData } = body
  return prisma.passwordPuzzle.create({
    data: {
      ...puzzleData,
      timeLimit: timeLimit ?? TIME_LIMITS[puzzleData.difficulty],
      hints: { create: hints },
    },
    include: { hints: { orderBy: { order: 'asc' } } },
  })
}

export async function getAllPuzzles() {
  return prisma.passwordPuzzle.findMany({
    include: { hints: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getPuzzleById(id: string) {
  const puzzle = await prisma.passwordPuzzle.findUnique({
    where: { id },
    include: { hints: { orderBy: { order: 'asc' } } },
  })
  if (!puzzle) throw new AppError('Puzzle not found', 404)
  return puzzle
}

export async function updatePuzzle(id: string, body: UpdatePuzzleBody) {
  const exists = await prisma.passwordPuzzle.findUnique({ where: { id } })
  if (!exists) throw new AppError('Puzzle not found', 404)
  return prisma.passwordPuzzle.update({
    where: { id },
    data: body,
    include: { hints: { orderBy: { order: 'asc' } } },
  })
}

export async function deletePuzzle(id: string) {
  const exists = await prisma.passwordPuzzle.findUnique({ where: { id } })
  if (!exists) throw new AppError('Puzzle not found', 404)
  await prisma.puzzleHint.deleteMany({ where: { puzzleId: id } })
  await prisma.passwordPuzzle.delete({ where: { id } })
}
