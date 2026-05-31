import { z } from "zod";
import {GetChallengesSchema,CreateChallengeSchema,UpdateChallengeSchema,} from "../schemas/challenge.schema";

export type GetChallengesQuery  = z.infer<typeof GetChallengesSchema>;
export type CreateChallengeBody = z.infer<typeof CreateChallengeSchema>;
export type UpdateChallengeBody = z.infer<typeof UpdateChallengeSchema>;