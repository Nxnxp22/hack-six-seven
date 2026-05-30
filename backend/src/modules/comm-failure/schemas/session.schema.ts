import { z } from "zod";

export const CreateSessionSchema = z.object({
  playerName: z.string().min(1).max(32).default("OPERATIVE"),
});

export const CreateScoreSchema = z.object({
  word:      z.string(),
  correct:   z.boolean(),
  timeTaken: z.number().min(0),
  round:     z.number().min(1),
});