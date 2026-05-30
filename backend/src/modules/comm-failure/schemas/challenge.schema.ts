import { z } from "zod";

export const GetChallengesSchema = z.object({
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  category:   z.string().optional(),
  count:      z.coerce.number().min(1).max(20).default(5),
});

export const CreateChallengeSchema = z.object({
  word:       z.string().min(1).max(20).toUpperCase(),
  category:   z.string().default("general"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
});

export const UpdateChallengeSchema = z.object({
  active:     z.boolean().optional(),
  word:       z.string().min(1).max(20).optional(),
  category:   z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});