import { Request, Response } from 'express';
import { createScoreSchema, updateScoreSchema } from '../schemas';
import * as scoreModel from '../models/scoreModel';

export async function createScore(req: Request, res: Response) {
  try {
    const parsed = createScoreSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const score = await scoreModel.createScore(parsed.data);
    return res.status(201).json(score);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save score' });
  }
}

export async function getAllScores(_req: Request, res: Response) {
  try {
    const scores = await scoreModel.getAllScores();
    return res.status(200).json(scores);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch scores' });
  }
}

export async function getScoreById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const score = await scoreModel.getScoreById(id);
    if (!score) return res.status(404).json({ error: 'Score not found' });
    return res.status(200).json(score);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch score' });
  }
}

export async function updateScore(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const parsed = updateScoreSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const updated = await scoreModel.updateScore(id, parsed.data);
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update score' });
  }
}

export async function deleteScore(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    
    // Check if score exists first
    const score = await scoreModel.getScoreById(id);
    if (!score) return res.status(404).json({ error: 'Score not found' });

    await scoreModel.deleteScore(id);
    return res.status(200).json({ message: 'Score deleted' });
  } catch (err) {
    console.error("DEBUG: deleteScore error:", err);
    return res.status(500).json({ error: 'Failed to delete score' });
  }
}
