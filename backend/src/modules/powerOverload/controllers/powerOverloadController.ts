import { Request, Response } from 'express';
import { getRulesFromDB, getCriticalTemplateFromDB } from '../../../db.js';
import { prisma } from '../../../prisma.js';

interface Wire {
  id: string;
  color: string;
  label: string;
  isCut: boolean;
}

interface GameSession {
  sessionId: string;
  serialNumber: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  wires: Wire[];
  correctSequence: number[];
  cutHistory: number[];
  totalCutsNeeded: number;
  timeLimitSeconds: number;
  hintsPurchasedCount: number;
}

const COLOR_POOL = ['GREEN', 'YELLOW', 'CYAN', 'RED', 'BLUE', 'ORANGE', 'PURPLE'];

const COLOR_HEX: Record<string, string> = {
  RED: '#E11D48',
  BLUE: '#2563EB',
  GREEN: '#00C838',
  YELLOW: '#FFBC00',
  CYAN: '#00B4DB',
  ORANGE: '#F97316',
  PURPLE: '#9333EA',
};

const COLOR_SYSTEM_NAME: Record<string, string> = {
  RED: 'DANGER-CORE',
  BLUE: 'HYDRO-GRID',
  GREEN: 'BIO-SYNAPSE',
  YELLOW: 'SOLAR-VOLT',
  CYAN: 'CRYO-LINK',
  ORANGE: 'THERMO-CELL',
  PURPLE: 'VOID-NODE',
};

const DIFFICULTY_CONFIG = {
  EASY:   { wireCount: 3, neededCuts: 1, timeLimit: 60, maxHints: 1 },
  MEDIUM: { wireCount: 5, neededCuts: 2, timeLimit: 30, maxHints: 2 },
  HARD:   { wireCount: 5, neededCuts: 3, timeLimit: 25, maxHints: 3 },
} as const;

// In-memory active game sessions cache
const sessions = new Map<string, GameSession>();

const generateRandomWires = (count: number): Wire[] => {
  const shuffled = [...COLOR_POOL].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  selected.sort((a, b) => COLOR_POOL.indexOf(a) - COLOR_POOL.indexOf(b));

  return selected.map((color, index) => ({
    id: `w${index + 1}`,
    color,
    label: color,
    isCut: false,
  }));
};

const solveGrid = (wireList: Wire[], diff: string): number[] => {
  if (diff === 'EASY') {
    const redIdx = wireList.findIndex(w => w.color === 'RED');
    if (redIdx !== -1) return [redIdx];
    if (wireList[wireList.length - 1].color === 'BLUE') return [wireList.length - 1];
    return [0];
  }

  if (diff === 'MEDIUM') {
    const yellowIdx = wireList.findIndex(w => w.color === 'YELLOW');
    const t1 = yellowIdx !== -1 ? yellowIdx : 2;

    const lastIsGreen = wireList[wireList.length - 1].color === 'GREEN';
    let t2 = lastIsGreen ? wireList.length - 1 : 0;
    if (t1 === t2) t2 = wireList.length - 1;

    return [t1, t2];
  }

  // HARD
  const cuts = new Set<number>();

  const greenIdx = wireList.findIndex(w => w.color === 'GREEN');
  const w1 = greenIdx !== -1 ? greenIdx : 0;
  cuts.add(w1);

  let w2 = wireList.findIndex(w => w.color === 'CYAN');
  if (w2 === -1) w2 = 3;
  while (cuts.has(w2)) w2 = (w2 + 1) % 5;
  cuts.add(w2);

  const lastColor = wireList[wireList.length - 1].color;
  let w3 = (lastColor === 'ORANGE' || lastColor === 'PURPLE') ? wireList.length - 1 : 1;
  while (cuts.has(w3)) w3 = (w3 + 1) % 5;

  return [w1, w2, w3];
};

const buildInstruction = (
  diff: string,
  wires: Wire[],
  sequence: number[],
  template: string,
): string => {
  if (diff === 'EASY') {
    const color = wires[sequence[0]]?.color ?? 'GREEN';
    return template.replace('{color}', color);
  }

  if (diff === 'MEDIUM') {
    const hex1 = COLOR_HEX[wires[sequence[0]]?.color] ?? '#FFFFFF';
    const hex2 = COLOR_HEX[wires[sequence[1]]?.color] ?? '#FFFFFF';
    return template.replace('{hex1}', hex1).replace('{hex2}', hex2);
  }

  // HARD
  const name1 = COLOR_SYSTEM_NAME[wires[sequence[0]]?.color] ?? 'SYSTEM-NODE';
  const name2 = COLOR_SYSTEM_NAME[wires[sequence[1]]?.color] ?? 'SYSTEM-NODE';
  const name3 = COLOR_SYSTEM_NAME[wires[sequence[2]]?.color] ?? 'SYSTEM-NODE';
  return template.replace('{name1}', name1).replace('{name2}', name2).replace('{name3}', name3);
};

const buildHintText = (session: GameSession, hintOrder: number): string => {
  const nextStepIdx = session.cutHistory.length;

  if (nextStepIdx >= session.totalCutsNeeded) {
    return 'Defusal already complete. No further hints required.';
  }

  const correctWire = session.wires[session.correctSequence[nextStepIdx]];
  const isEasy = session.difficulty === 'EASY';

  if (hintOrder === 1) {
    const otherWires = session.wires.filter(w => w.color !== correctWire.color);
    const incorrectColor = otherWires.length > 0
      ? otherWires[Math.floor(Math.random() * otherWires.length)].color
      : 'GREEN';
    const [a, b] = [correctWire.color, incorrectColor].sort(() => Math.random() - 0.5);

    return isEasy
      ? `DECRYPTION HINT (HINT 1): The target wire to stabilize the junction is either ${a} or ${b}.`
      : `DECRYPTION HINT (HINT 1): Step ${nextStepIdx + 1} of your defusal sequence requires cutting either the ${a} or the ${b} wire.`;
  }

  return isEasy
    ? `DIRECT SOLUTION (HINT 2): Sever the ${correctWire.color} wire immediately.`
    : `DIRECT SOLUTION (HINT 2): Step ${nextStepIdx + 1} of your defusal sequence requires cutting the ${correctWire.color} wire.`;
};

export const getNewGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { difficulty, restoreSessionId } = req.body;
    const diff = (difficulty || 'EASY').toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';

    if (restoreSessionId) {
      const existing = sessions.get(restoreSessionId);
      if (existing && existing.difficulty === diff) {
        const template = await getCriticalTemplateFromDB(diff);
        if (template) {
          res.status(200).json({
            sessionId: existing.sessionId,
            serialNumber: existing.serialNumber,
            difficulty: existing.difficulty,
            instruction: buildInstruction(diff, existing.wires, existing.correctSequence, template),
            totalCutsNeeded: existing.totalCutsNeeded,
            currentCuts: existing.cutHistory.length,
            timeLimitSeconds: existing.timeLimitSeconds,
            wires: existing.wires,
          });
          return;
        }
      }
    }

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randLetter = () => letters[Math.floor(Math.random() * letters.length)];
    const randDigit = () => Math.floor(Math.random() * 10);
    const serial = `PKY-${randDigit()}${randDigit()}${randDigit()}${randLetter()}`;

    const { wireCount, neededCuts, timeLimit } = DIFFICULTY_CONFIG[diff];
    const generatedWires = generateRandomWires(wireCount);
    const correctSequence = solveGrid(generatedWires, diff);

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: GameSession = {
      sessionId,
      serialNumber: serial,
      difficulty: diff,
      wires: generatedWires,
      correctSequence,
      cutHistory: [],
      totalCutsNeeded: neededCuts,
      timeLimitSeconds: timeLimit,
      hintsPurchasedCount: 0,
    };
    sessions.set(sessionId, session);

    const template = await getCriticalTemplateFromDB(diff);
    if (!template) {
      res.status(503).json({ error: `No critical template for ${diff}. Run: npm run db:seed` });
      return;
    }

    res.status(200).json({
      sessionId,
      serialNumber: serial,
      difficulty: diff,
      instruction: buildInstruction(diff, generatedWires, correctSequence, template),
      totalCutsNeeded: neededCuts,
      currentCuts: 0,
      timeLimitSeconds: timeLimit,
      wires: generatedWires,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const checkWire = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, wireId } = req.body;

    if (!sessionId || !wireId) {
      res.status(400).json({ success: false, message: 'Missing sessionId or wireId.' });
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ success: false, message: 'Active game session not found.' });
      return;
    }

    const wireIdx = session.wires.findIndex(w => w.id === wireId);
    if (wireIdx === -1) {
      res.status(404).json({ success: false, message: 'Wire not found in junction box.' });
      return;
    }

    if (session.wires[wireIdx].isCut) {
      res.status(400).json({ success: false, message: 'Wire has already been severed.' });
      return;
    }

    session.wires[wireIdx].isCut = true;

    const expectedIdx = session.correctSequence[session.cutHistory.length];
    if (wireIdx !== expectedIdx) {
      sessions.delete(sessionId);
      res.status(200).json({
        success: false,
        currentCuts: session.cutHistory.length,
        isGameOver: true,
        message: 'CRITICAL FAILURE: JUNCTION EXPLODED.',
      });
      return;
    }

    session.cutHistory.push(wireIdx);
    const isGameOver = session.cutHistory.length === session.totalCutsNeeded;
    if (isGameOver) sessions.delete(sessionId);

    res.status(200).json({
      success: true,
      currentCuts: session.cutHistory.length,
      isGameOver,
      message: isGameOver ? 'SUCCESSFULLY DEFUSED!' : 'CORRECT SEVERANCE.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getManual = async (req: Request, res: Response): Promise<void> => {
  try {
    const difficulty = (req.query.difficulty || 'EASY').toString().toUpperCase();
    const rules = await getRulesFromDB(difficulty);
    res.status(200).json(rules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getHint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, hintOrder } = req.body;

    if (!sessionId || !hintOrder) {
      res.status(400).json({ success: false, message: 'Missing sessionId or hintOrder.' });
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ success: false, message: 'Active game session not found.' });
      return;
    }

    const { maxHints } = DIFFICULTY_CONFIG[session.difficulty];
    if ((session.hintsPurchasedCount ?? 0) >= maxHints) {
      res.status(400).json({ success: false, message: 'HINT_LIMIT_REACHED' });
      return;
    }

    const cost = hintOrder === 1 ? 15 : 20;

    const coinRow = await prisma.gameCoins.findFirst();
    const currentBalance = coinRow?.balance ?? 100;

    if (currentBalance < cost) {
      res.status(400).json({ success: false, message: 'INSUFFICIENT_COINS', cost, balance: currentBalance });
      return;
    }

    const newBalance = currentBalance - cost;
    if (coinRow) {
      await prisma.gameCoins.update({ where: { id: coinRow.id }, data: { balance: newBalance } });
    } else {
      await prisma.gameCoins.create({ data: { balance: newBalance } });
    }

    session.hintsPurchasedCount = (session.hintsPurchasedCount ?? 0) + 1;

    res.status(200).json({
      success: true,
      hintText: buildHintText(session, hintOrder),
      cost,
      balance: newBalance,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
