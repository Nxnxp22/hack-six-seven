import { z } from 'zod';

export const createScoreSchema = z.object({
  playerName:  z.string().min(1).max(30),
  difficulty:  z.enum(['easy', 'medium', 'hard']),
  score:       z.number().int().min(0),
  win:         z.boolean(),
  timeTakenMs: z.number().int().min(0),
});

export const updateScoreSchema = z.object({
  playerName:  z.string().min(1).max(30).optional(),
  difficulty:  z.enum(['easy', 'medium', 'hard']).optional(),
  score:       z.number().int().min(0).optional(),
  win:         z.boolean().optional(),
  timeTakenMs: z.number().int().min(0).optional(),
});