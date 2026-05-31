import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ChallengeModel } from "../models/challenge.model";
import {
  GetChallengesSchema,
  CreateChallengeSchema,
  UpdateChallengeSchema,
} from "../schemas/challenge.schema";

export const ChallengeController = {
  async getMany(req: Request, res: Response, next: NextFunction) {
    try {
      const query      = GetChallengesSchema.parse(req.query);
      const challenges = await ChallengeModel.getRandom(query);
      const shuffled   = challenges.sort(() => Math.random() - 0.5);
      res.json({ challenges: shuffled });
    } catch (err) { next(err); }
  },

  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const challenges = await ChallengeModel.getAll();
      res.json({ challenges });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body      = CreateChallengeSchema.parse(req.body);
      const challenge = await ChallengeModel.create(body);
      res.status(201).json({ challenge });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id        = z.string().uuid().parse(req.params.id);
      const body      = UpdateChallengeSchema.parse(req.body);
      const challenge = await ChallengeModel.update(id, body);
      res.json({ challenge });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = z.string().uuid().parse(req.params.id);
      await ChallengeModel.delete(id);
      res.json({ message: "Challenge deleted" });
    } catch (err) { next(err); }
  },
};