import { api } from '../../../api'
import type {
  Difficulty,
  PuzzlePublicDTO,
  RevealHintResponseDTO,
  SubmitRequestDTO,
  SubmitResponseDTO,
} from '../types/passwordPuzzle.types'

export async function fetchRandomPuzzle(difficulty: Difficulty): Promise<PuzzlePublicDTO> {
  const { data } = await api.get<PuzzlePublicDTO>('/password-puzzle/random', {
    params: { difficulty },
  })
  return data
}

export async function revealHint(puzzleId: string, hintId: string): Promise<RevealHintResponseDTO> {
  const { data } = await api.post<RevealHintResponseDTO>('/password-puzzle/hint', {
    puzzleId,
    hintId,
  })
  return data
}

export async function submitAnswer(payload: SubmitRequestDTO): Promise<SubmitResponseDTO> {
  const { data } = await api.post<SubmitResponseDTO>('/password-puzzle/submit', payload)
  return data
}
