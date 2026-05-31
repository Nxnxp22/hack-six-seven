import { Request, Response } from 'express';
import { prisma } from '../../prisma.js';

// ─── Decay rates: -1% per N ms (matches frontend MODULE_DECAY_MS) ─────────────
const DECAY_INTERVAL_MS: Record<string, number> = {
  powerOverload:    5_000,   // -1% every 5s  (yellow)
  reactionFailure:  7_000,   // -1% every 7s  (orange)
  commCollapse:    10_000,   // -1% every 10s (cyan)
  securityLockdown:14_000,   // -1% every 14s (purple)
};

const MODULE_IDS = Object.keys(DECAY_INTERVAL_MS);

// ─── Helper: compute current stability for one module row ────────────────────
const computeStability = (
  startedAt: Date,
  bonusStability: number,
  moduleId: string,
): number => {
  const decayMs = DECAY_INTERVAL_MS[moduleId] ?? 10_000;
  const elapsed = Date.now() - startedAt.getTime();
  const decayed = Math.floor(elapsed / decayMs);
  return Math.max(0, Math.min(100, 100 - decayed + bonusStability));
};

// ─── Ensure all 4 module rows exist (lazy init) ───────────────────────────────
const ensureModulesExist = async () => {
  for (const moduleId of MODULE_IDS) {
    await prisma.moduleStability.upsert({
      where: { moduleId },
      create: { moduleId },
      update: {}, // don't overwrite if already exists
    });
  }
};

// ─── GET /api/stability ───────────────────────────────────────────────────────
/**
 * Returns the current stability % for all 4 modules.
 * Response: { modules: { moduleId, stability }[] }
 */
export const getStability = async (_req: Request, res: Response): Promise<void> => {
  try {
    await ensureModulesExist();

    const rows = await prisma.moduleStability.findMany();

    const modules = rows.map((row) => ({
      moduleId: row.moduleId,
      stability: computeStability(row.startedAt, row.bonusStability, row.moduleId),
    }));

    res.status(200).json({ modules });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ─── POST /api/stability/apply ────────────────────────────────────────────────
/**
 * Applies a stability delta (positive = gain, negative = loss) to a module.
 * Body: { moduleId: string, delta: number }
 * Response: { moduleId, stability }
 */
export const applyStability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { moduleId, delta } = req.body as { moduleId: string; delta: number };

    if (!moduleId || delta === undefined || !MODULE_IDS.includes(moduleId)) {
      res.status(400).json({ error: 'Invalid moduleId or missing delta.' });
      return;
    }

    await ensureModulesExist();

    const row = await prisma.moduleStability.findUnique({ where: { moduleId } });
    if (!row) {
      res.status(404).json({ error: 'Module not found.' });
      return;
    }

    // Compute how much stability has decayed so far
    const currentStability = computeStability(row.startedAt, row.bonusStability, moduleId);

    // New bonus = what we'd need so current + delta is correct
    // currentStability = 100 - decayed + bonusStability
    // => bonusStability = currentStability - (100 - decayed)
    // newStability = currentStability + delta  (clamped)
    const newStability = Math.max(0, Math.min(100, currentStability + delta));
    const decayed = Math.floor((Date.now() - row.startedAt.getTime()) / (DECAY_INTERVAL_MS[moduleId] ?? 10_000));
    const newBonus = newStability - (100 - decayed);

    await prisma.moduleStability.update({
      where: { moduleId },
      data: { bonusStability: newBonus },
    });

    res.status(200).json({ moduleId, stability: newStability });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ─── POST /api/stability/reset ────────────────────────────────────────────────
/**
 * Resets all modules: startedAt = now, bonusStability = 0 → back to 100%.
 * Also resets coins to 100.
 */
export const resetStability = async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();

    await prisma.moduleStability.deleteMany();
    await prisma.moduleStability.createMany({
      data: MODULE_IDS.map((moduleId) => ({
        moduleId,
        startedAt: now,
        bonusStability: 0,
      })),
    });

    // Reset coins too
    await prisma.gameCoins.deleteMany();
    await prisma.gameCoins.create({ data: { balance: 100 } });

    res.status(200).json({ message: 'All modules reset to 100% stability. Coins reset to 100.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Helper: ensure coins row exists ─────────────────────────────────────────
const ensureCoinsExist = async (): Promise<number> => {
  const row = await prisma.gameCoins.findFirst();
  if (row) return row.id;
  const created = await prisma.gameCoins.create({ data: { balance: 100 } });
  return created.id;
};

// ─── GET /api/stability/coins ─────────────────────────────────────────────────
/** Returns { balance: number } */
export const getCoins = async (_req: Request, res: Response): Promise<void> => {
  try {
    const id = await ensureCoinsExist();
    const row = await prisma.gameCoins.findUnique({ where: { id } });
    res.status(200).json({ balance: row?.balance ?? 100 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ─── POST /api/stability/coins/apply ──────────────────────────────────────────
/**
 * Applies a coin delta (positive = earn, negative = spend).
 * Rejects with 400 if the balance would go below 0.
 * Body: { delta: number }
 * Response: { balance: number }
 */
export const applyCoins = async (req: Request, res: Response): Promise<void> => {
  try {
    const { delta } = req.body as { delta: number };

    if (delta === undefined || typeof delta !== 'number') {
      res.status(400).json({ error: 'Missing or invalid delta.' });
      return;
    }

    const id = await ensureCoinsExist();
    const row = await prisma.gameCoins.findUnique({ where: { id } });
    const current = row?.balance ?? 100;
    const newBalance = current + delta;

    if (newBalance < 0) {
      res.status(400).json({ error: 'INSUFFICIENT_COINS', balance: current });
      return;
    }

    const updated = await prisma.gameCoins.update({
      where: { id },
      data: { balance: newBalance },
    });

    res.status(200).json({ balance: updated.balance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
