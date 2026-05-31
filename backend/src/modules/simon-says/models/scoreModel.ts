import db from '../../../db';
import type { CreateScoreInput, UpdateScoreInput } from '../types';

export async function createScore(data: CreateScoreInput) {
  return db.simonSaysScore.create({ data });
}

export async function getAllScores() {
  return db.simonSaysScore.findMany({
    orderBy: { score: 'desc' },
    take: 10,
  });
}

export async function getScoreById(id: number) {
  return db.simonSaysScore.findUnique({ where: { id } });
}

export async function updateScore(id: number, data: UpdateScoreInput) {
  return db.simonSaysScore.update({ where: { id }, data });
}

export async function deleteScore(id: number) {
  return db.simonSaysScore.delete({ where: { id } });
}
