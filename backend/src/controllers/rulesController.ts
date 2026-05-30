import { Request, Response } from 'express';
import {
  getAllRulesFromDB,
  getRuleByIdFromDB,
  getRulesFromDB,
  createRuleInDB,
  updateRuleInDB,
  deleteRuleFromDB,
} from '../db.js';

const VALID_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;

const parseRuleBody = (body: Record<string, unknown>) => {
  const difficulty = String(body.difficulty ?? '').toUpperCase();
  const rule_number = Number(body.rule_number);
  const description = String(body.description ?? '').trim();

  if (!VALID_DIFFICULTIES.includes(difficulty as (typeof VALID_DIFFICULTIES)[number])) {
    return { error: 'difficulty must be EASY, MEDIUM, or HARD' };
  }
  if (!Number.isInteger(rule_number) || rule_number < 1) {
    return { error: 'rule_number must be a positive integer' };
  }
  if (!description) {
    return { error: 'description is required' };
  }
  return { difficulty, rule_number, description };
};

/** GET /api/game/rules — all rules */
export const listAllRules = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rules = await getAllRulesFromDB();
    res.status(200).json(rules);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

/** GET /api/game/rules/by-difficulty?difficulty=EASY — same data as /manual */
export const listRulesByDifficulty = async (req: Request, res: Response): Promise<void> => {
  try {
    const difficulty = (req.query.difficulty || 'EASY').toString().toUpperCase();
    if (!VALID_DIFFICULTIES.includes(difficulty as (typeof VALID_DIFFICULTIES)[number])) {
      res.status(400).json({ error: 'difficulty must be EASY, MEDIUM, or HARD' });
      return;
    }
    const rules = await getRulesFromDB(difficulty);
    res.status(200).json(rules);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

/** GET /api/game/rules/:id */
export const getRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: 'invalid rule id' });
      return;
    }
    const rule = await getRuleByIdFromDB(id);
    if (!rule) {
      res.status(404).json({ error: 'rule not found' });
      return;
    }
    res.status(200).json(rule);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

/** POST /api/game/rules */
export const createRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = parseRuleBody(req.body);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const id = await createRuleInDB(parsed.difficulty, parsed.rule_number, parsed.description);
    const rule = await getRuleByIdFromDB(id);
    res.status(201).json(rule);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

/** PUT /api/game/rules/:id */
export const updateRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: 'invalid rule id' });
      return;
    }
    const existing = await getRuleByIdFromDB(id);
    if (!existing) {
      res.status(404).json({ error: 'rule not found' });
      return;
    }
    const parsed = parseRuleBody(req.body);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    await updateRuleInDB(id, parsed.difficulty, parsed.rule_number, parsed.description);
    const rule = await getRuleByIdFromDB(id);
    res.status(200).json(rule);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

/** DELETE /api/game/rules/:id */
export const deleteRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: 'invalid rule id' });
      return;
    }
    const existing = await getRuleByIdFromDB(id);
    if (!existing) {
      res.status(404).json({ error: 'rule not found' });
      return;
    }
    await deleteRuleFromDB(id);
    res.status(204).send();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};
