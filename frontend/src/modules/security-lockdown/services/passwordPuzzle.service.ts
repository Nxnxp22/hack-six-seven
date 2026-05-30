import { api } from '../../../api'
import type {
  GameStateDTO,
  PuzzlePublicDTO,
  RevealHintResponseDTO,
  SubmitRequestDTO,
  SubmitResponseDTO,
} from '../types/passwordPuzzle.types'

export async function fetchGameState(): Promise<GameStateDTO> {
  const { data } = await api.get<GameStateDTO>('/password-puzzle/stability')
  return data
}

// Difficulty is now chosen by the server — do not pass it from the frontend
export async function fetchRandomPuzzle(): Promise<PuzzlePublicDTO> {
  const { data } = await api.get<PuzzlePublicDTO>('/password-puzzle/random')
  return data
}

export async function fetchPuzzleById(id: string): Promise<PuzzlePublicDTO> {
  const { data } = await api.get<PuzzlePublicDTO>(`/password-puzzle/${id}/public`)
  return data
}

export async function revealHint(puzzleId: string, hintId: string): Promise<RevealHintResponseDTO> {
  const { data } = await api.post<RevealHintResponseDTO>('/password-puzzle/hint', { puzzleId, hintId })
  return data
}

export async function submitAnswer(payload: SubmitRequestDTO): Promise<SubmitResponseDTO> {
  const { data } = await api.post<SubmitResponseDTO>('/password-puzzle/submit', payload)
  return data
}
