import { Request, Response } from 'express';
import {
  getAllCriticalTemplatesFromDB,
  getCriticalTemplateByIdFromDB,
  createCriticalTemplateInDB,
  updateCriticalTemplateInDB,
  deleteCriticalTemplateFromDB,
  getCriticalTemplateByDifficultyFromDB,
} from '../db.js';

const VALID_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;

const parseTemplateBody = (body: Record<string, unknown>) => {
  const difficulty = String(body.difficulty ?? '').toUpperCase();
  const template = String(body.template ?? '').trim();

  if (!VALID_DIFFICULTIES.includes(difficulty as (typeof VALID_DIFFICULTIES)[number])) {
    return { error: 'difficulty must be EASY, MEDIUM, or HARD' };
  }
  if (!template) {
    return { error: 'template is required' };
  }
  return { difficulty, template };
};

/** GET /api/game/templates/by-difficulty?difficulty=EASY */
export const getTemplateByDifficulty = async (req: Request, res: Response): Promise<void> => {
  try {
    const difficulty = (req.query.difficulty || '').toString().toUpperCase();
    if (!VALID_DIFFICULTIES.includes(difficulty as (typeof VALID_DIFFICULTIES)[number])) {
      res.status(400).json({ error: 'difficulty must be EASY, MEDIUM, or HARD' });
      return;
    }
    const row = await getCriticalTemplateByDifficultyFromDB(difficulty);
    if (!row) {
      res.status(404).json({ error: 'template not found' });
      return;
    }
    res.status(200).json(row);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

/** GET /api/game/templates */
export const listAllTemplates = async (_req: Request, res: Response): Promise<void> => {
  try {
    const templates = await getAllCriticalTemplatesFromDB();
    res.status(200).json(templates);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

/** GET /api/game/templates/:id */
export const getTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: 'invalid template id' });
      return;
    }
    const row = await getCriticalTemplateByIdFromDB(id);
    if (!row) {
      res.status(404).json({ error: 'template not found' });
      return;
    }
    res.status(200).json(row);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

/** POST /api/game/templates */
export const createTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = parseTemplateBody(req.body);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const id = await createCriticalTemplateInDB(parsed.difficulty, parsed.template);
    const row = await getCriticalTemplateByIdFromDB(id);
    res.status(201).json(row);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

/** PUT /api/game/templates/:id */
export const updateTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: 'invalid template id' });
      return;
    }
    const existing = await getCriticalTemplateByIdFromDB(id);
    if (!existing) {
      res.status(404).json({ error: 'template not found' });
      return;
    }
    const parsed = parseTemplateBody(req.body);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    await updateCriticalTemplateInDB(id, parsed.difficulty, parsed.template);
    const row = await getCriticalTemplateByIdFromDB(id);
    res.status(200).json(row);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

/** DELETE /api/game/templates/:id */
export const deleteTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: 'invalid template id' });
      return;
    }
    const existing = await getCriticalTemplateByIdFromDB(id);
    if (!existing) {
      res.status(404).json({ error: 'template not found' });
      return;
    }
    await deleteCriticalTemplateFromDB(id);
    res.status(204).send();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};
