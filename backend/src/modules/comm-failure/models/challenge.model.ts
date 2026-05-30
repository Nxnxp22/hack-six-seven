import { prisma } from "../../../db";
import { GetChallengesQuery, CreateChallengeBody, UpdateChallengeBody } from "../types/challenge.type";

export const ChallengeModel = {
  async getRandom({ difficulty, category, count }: GetChallengesQuery) {
    const where = {
      active: true,
      ...(difficulty && { difficulty }),
      ...(category   && { category }),
    };

    const total = await prisma.morseChallenge.count({ where });
    const skip  = Math.max(0, Math.floor(Math.random() * Math.max(1, total - count)));

    return prisma.morseChallenge.findMany({
      where,
      skip,
      take: count,
      select: { id: true, word: true, category: true, difficulty: true },
    });
  },

  async getAll() {
    return prisma.morseChallenge.findMany({
      orderBy: [{ difficulty: "asc" }, { word: "asc" }],
    });
  },

  async create(data: CreateChallengeBody) {
    return prisma.morseChallenge.create({ data });
  },

  async update(id: string, data: UpdateChallengeBody) {
    return prisma.morseChallenge.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.morseChallenge.delete({ where: { id } });
  },
};