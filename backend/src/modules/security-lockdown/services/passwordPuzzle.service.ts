import { prisma } from '../../../db'
import { AppError } from '../../../shared/errors'
import type { Difficulty, PuzzlePublicDTO, RevealHintResponseDTO, SubmitResponseDTO } from '../types/passwordPuzzle.types'
import type { SubmitBody } from '../validators/passwordPuzzle.validator'

// Game balance constants (difficulty/reward)
const COINS_ON_SUCCESS = 20
const STABILITY_ON_SUCCESS = 10
const STABILITY_ON_FAILURE = -10
const MAX_STABILITY = 100
const MIN_STABILITY = 0

// Creates the game state if it doesn't exist
async function getOrCreateGameState() {
  const state = await prisma.gameState.findFirst()
  if (state) return state
  return prisma.gameState.create({ data: {} })
}

// Returns a random puzzle by difficulty
export async function getRandomPuzzle(difficulty: Difficulty): Promise<PuzzlePublicDTO> {
  const count = await prisma.passwordPuzzle.count({ where: { difficulty } })
  if (count === 0) {
    throw new AppError(`No puzzles available for difficulty: ${difficulty}`, 404)
  }

  // Random selection
  const skip = Math.floor(Math.random() * count)
  const puzzle = await prisma.passwordPuzzle.findFirst({
    where: { difficulty },
    skip,
    include: {
      hints: {
        // Hide hint text until the player pays
        select: { id: true, order: true, coinCost: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!puzzle) throw new AppError('Puzzle not found', 404)

  return {
    id: puzzle.id,
    title: puzzle.title,
    difficulty: puzzle.difficulty as Difficulty,
    clueText: puzzle.clueText,
    hints: puzzle.hints,
  }
}

// Removes coins and gives the hint
export async function revealHint(puzzleId: string, hintId: string): Promise<RevealHintResponseDTO> {
  const hint = await prisma.puzzleHint.findFirst({
    where: { id: hintId, puzzleId },
  })
  if (!hint) throw new AppError('Hint not found', 404)

  const gameState = await getOrCreateGameState()
  if (gameState.coins < hint.coinCost) {
    throw new AppError(`Insufficient coins — need ${hint.coinCost}, have ${gameState.coins}`, 400)
  }

  const updated = await prisma.gameState.update({
    where: { id: gameState.id },
    data: { coins: { decrement: hint.coinCost } },
  })

  return {
    hintText: hint.hintText,
    coinCost: hint.coinCost,
    coinsRemaining: updated.coins,
  }
}

// Validates answer, updates stability + coins, and records the attempt
export async function submitAnswer(body: SubmitBody): Promise<SubmitResponseDTO> {
  const puzzle = await prisma.passwordPuzzle.findUnique({
    where: { id: body.puzzleId },
  })
  if (!puzzle) throw new AppError('Puzzle not found', 404)

  // Case-insensitive, whitespace-trimmed comparison
  const correct =
    puzzle.answer.trim().toLowerCase() === body.answer.trim().toLowerCase()

  const stabilityDelta = correct ? STABILITY_ON_SUCCESS : STABILITY_ON_FAILURE
  const coinsDelta = correct ? COINS_ON_SUCCESS : 0

  const gameState = await getOrCreateGameState()

  const newStability = Math.max(
    MIN_STABILITY,
    Math.min(MAX_STABILITY, gameState.securityStability + stabilityDelta),
  )
  const newCoins = Math.max(0, gameState.coins + coinsDelta)

  // Update game state and record attempt
  const [updatedState] = await prisma.$transaction([
    prisma.gameState.update({
      where: { id: gameState.id },
      data: { securityStability: newStability, coins: newCoins },
    }),
    prisma.puzzleAttempt.create({
      data: {
        puzzleId: body.puzzleId,
        correct,
        timeTaken: body.timeTaken,
        hintsUsed: body.hintsUsed,
        coinsSpentHints: body.coinsSpentHints,
        coinsChange: coinsDelta,
        stabilityChange: stabilityDelta,
      },
    }),
  ])

  return {
    correct,
    stabilityChange: stabilityDelta,
    coinsChange: coinsDelta,
    currentCoins: updatedState.coins,
    currentStability: updatedState.securityStability,
    timeTaken: body.timeTaken,
    hintsUsed: body.hintsUsed,
    coinsSpentHints: body.coinsSpentHints,
  }
}
