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
 
// In-memory active game sessions cache
const sessions = new Map<string, GameSession>();
 
const generateRandomWires = (count: number): Wire[] => {
  const colorPool = ['GREEN', 'YELLOW', 'CYAN', 'RED', 'BLUE', 'ORANGE', 'PURPLE'];
  const shuffled = [...colorPool].sort(() => Math.random() - 0.5);
  const selectedColors = shuffled.slice(0, count);
  // Sort the selected colors to match the order: GREEN, YELLOW, CYAN, RED, BLUE, ORANGE, PURPLE
  selectedColors.sort((a, b) => colorPool.indexOf(a) - colorPool.indexOf(b));
  
  return selectedColors.map((color, index) => ({
    id: `w${index + 1}`,
    color,
    label: color,
    isCut: false
  }));
};
 
// Solve function matching rulebook logic
const solveGrid = (wireList: Wire[], diff: string): number[] => {
  if (diff === 'EASY') {
    const hasRed = wireList.some(w => w.color === 'RED');
    if (hasRed) {
      return [wireList.findIndex(w => w.color === 'RED')];
    }
    if (wireList[wireList.length - 1].color === 'BLUE') {
      return [wireList.length - 1];
    }
    return [0]; // default green
  } 
  
  if (diff === 'MEDIUM') {
    let t1 = -1;
    const hasYellow = wireList.some(w => w.color === 'YELLOW');
    if (hasYellow) {
      t1 = wireList.findIndex(w => w.color === 'YELLOW');
    } else {
      t1 = 2; // 3rd (middle) wire
    }
 
    let t2 = -1;
    if (wireList[wireList.length - 1].color === 'GREEN') {
      t2 = wireList.length - 1;
    } else {
      t2 = 0; // 1st wire
    }
 
    if (t1 === t2) {
      t2 = wireList.length - 1; // Cut last wire instead
    }
 
    return [t1, t2];
  }
 
  // HARD (5 wires)
  const cuts = new Set<number>();
  
  let w1 = wireList.some(w => w.color === 'GREEN') 
    ? wireList.findIndex(w => w.color === 'GREEN') 
    : 0;
  cuts.add(w1);
 
  let w2 = wireList.some(w => w.color === 'CYAN')
    ? wireList.findIndex(w => w.color === 'CYAN')
    : 3;
  
  while (cuts.has(w2)) {
    w2 = (w2 + 1) % 5;
  }
  cuts.add(w2);
 
  const lastColor = wireList[wireList.length - 1].color;
  let w3 = (lastColor === 'ORANGE' || lastColor === 'PURPLE')
    ? wireList.length - 1
    : 1;
 
  while (cuts.has(w3)) {
    w3 = (w3 + 1) % 5;
  }
  cuts.add(w3);
 
  return [w1, w2, w3];
};
 
/**
 * Starts a new game session and calculates correct sequence.
 */
export const getNewGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { difficulty, restoreSessionId } = req.body;
    const diff = (difficulty || 'EASY').toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
 
    if (restoreSessionId) {
      const existing = sessions.get(restoreSessionId);
      if (existing && existing.difficulty === diff) {
        const template = await getCriticalTemplateFromDB(diff);
        if (template) {
          const getSystemName = (color: string): string => {
            switch (color) {
              case 'RED': return 'DANGER-CORE';
              case 'BLUE': return 'HYDRO-GRID';
              case 'GREEN': return 'BIO-SYNAPSE';
              case 'YELLOW': return 'SOLAR-VOLT';
              case 'CYAN': return 'CRYO-LINK';
              case 'ORANGE': return 'THERMO-CELL';
              case 'PURPLE': return 'VOID-NODE';
              default: return 'SYSTEM-NODE';
            }
          };
 
          const getHexColor = (color: string): string => {
            switch (color) {
              case 'RED': return '#E11D48';
              case 'BLUE': return '#2563EB';
              case 'GREEN': return '#00C838';
              case 'YELLOW': return '#FFBC00';
              case 'CYAN': return '#00B4DB';
              case 'ORANGE': return '#F97316';
              case 'PURPLE': return '#9333EA';
              default: return '#FFFFFF';
            }
          };
 
          let instruction = '';
          if (diff === 'EASY') {
            const color = existing.wires[existing.correctSequence[0]]?.color || 'GREEN';
            instruction = template.replace('{color}', color);
          } else if (diff === 'MEDIUM') {
            const hex1 = getHexColor(existing.wires[existing.correctSequence[0]]?.color);
            const hex2 = getHexColor(existing.wires[existing.correctSequence[1]]?.color);
            instruction = template.replace('{hex1}', hex1).replace('{hex2}', hex2);
          } else {
            const name1 = getSystemName(existing.wires[existing.correctSequence[0]]?.color);
            const name2 = getSystemName(existing.wires[existing.correctSequence[1]]?.color);
            const name3 = getSystemName(existing.wires[existing.correctSequence[2]]?.color);
            instruction = template.replace('{name1}', name1).replace('{name2}', name2).replace('{name3}', name3);
          }
 
          res.status(200).json({
            sessionId: existing.sessionId,
            serialNumber: existing.serialNumber,
            difficulty: existing.difficulty,
            instruction,
            totalCutsNeeded: existing.totalCutsNeeded,
            currentCuts: existing.cutHistory.length,
            timeLimitSeconds: existing.timeLimitSeconds,
            wires: existing.wires
          });
          return;
        }
      }
    }
 
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randLetter = () => letters[Math.floor(Math.random() * letters.length)];
    const randDigit = () => Math.floor(Math.random() * 10);
    const serial = `PKY-${randDigit()}${randDigit()}${randDigit()}${randLetter()}`;
 
    let generatedWires: Wire[] = [];
    let neededCuts = 1;
    let timeLimit = 60;
 
    if (diff === 'EASY') {
      generatedWires = generateRandomWires(3);
      neededCuts = 1;
      timeLimit = 60;
    } else if (diff === 'MEDIUM') {
      generatedWires = generateRandomWires(5);
      neededCuts = 2;
      timeLimit = 30;
    } else {
      generatedWires = generateRandomWires(5);
      neededCuts = 3;
      timeLimit = 25;
    }
 
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const correctSequence = solveGrid(generatedWires, diff);
 
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
 
    // Helpers for dynamic hints
    const getSystemName = (color: string): string => {
      switch (color) {
        case 'RED': return 'DANGER-CORE';
        case 'BLUE': return 'HYDRO-GRID';
        case 'GREEN': return 'BIO-SYNAPSE';
        case 'YELLOW': return 'SOLAR-VOLT';
        case 'CYAN': return 'CRYO-LINK';
        case 'ORANGE': return 'THERMO-CELL';
        case 'PURPLE': return 'VOID-NODE';
        default: return 'SYSTEM-NODE';
      }
    };
 
    const getHexColor = (color: string): string => {
      switch (color) {
        case 'RED': return '#E11D48';
        case 'BLUE': return '#2563EB';
        case 'GREEN': return '#00C838';
        case 'YELLOW': return '#FFBC00';
        case 'CYAN': return '#00B4DB';
        case 'ORANGE': return '#F97316';
        case 'PURPLE': return '#9333EA';
        default: return '#FFFFFF';
      }
    };
 
    const template = await getCriticalTemplateFromDB(diff);
    if (!template) {
      res.status(503).json({
        error: `No critical template for ${diff}. Run: npm run db:seed`,
      });
      return;
    }
 
    let instruction = '';
 
    if (diff === 'EASY') {
      const color = generatedWires[correctSequence[0]]?.color || 'GREEN';
      instruction = template.replace('{color}', color);
    } else if (diff === 'MEDIUM') {
      const hex1 = getHexColor(generatedWires[correctSequence[0]]?.color);
      const hex2 = getHexColor(generatedWires[correctSequence[1]]?.color);
      instruction = template.replace('{hex1}', hex1).replace('{hex2}', hex2);
    } else {
      const name1 = getSystemName(generatedWires[correctSequence[0]]?.color);
      const name2 = getSystemName(generatedWires[correctSequence[1]]?.color);
      const name3 = getSystemName(generatedWires[correctSequence[2]]?.color);
      instruction = template.replace('{name1}', name1).replace('{name2}', name2).replace('{name3}', name3);
    }
 
    res.status(200).json({
      sessionId,
      serialNumber: serial,
      difficulty: diff,
      instruction,
      totalCutsNeeded: neededCuts,
      currentCuts: 0,
      timeLimitSeconds: timeLimit,
      wires: generatedWires
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
 
/**
 * Checks a cut wire request.
 */
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
 
    // Cut the wire in session
    session.wires[wireIdx].isCut = true;
 
    // Check if correct cut in sequence
    const currentStep = session.cutHistory.length;
    const expectedIdx = session.correctSequence[currentStep];
 
    if (wireIdx === expectedIdx) {
      session.cutHistory.push(wireIdx);
      const currentCuts = session.cutHistory.length;
      const isGameOver = currentCuts === session.totalCutsNeeded;
 
      if (isGameOver) {
        sessions.delete(sessionId);
      }
 
      res.status(200).json({
        success: true,
        currentCuts,
        isGameOver,
        message: isGameOver ? 'SUCCESSFULLY DEFUSED!' : 'CORRECT SEVERANCE.'
      });
    } else {
      sessions.delete(sessionId);
      res.status(200).json({
        success: false,
        currentCuts: session.cutHistory.length,
        isGameOver: true,
        message: 'CRITICAL FAILURE: JUNCTION EXPLODED.'
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
 
/**
 * Fetches decoding rules from the database.
 */
export const getManual = async (req: Request, res: Response): Promise<void> => {
  try {
    const difficulty = (req.query.difficulty || 'EASY').toString().toUpperCase();
    const rules = await getRulesFromDB(difficulty);
    res.status(200).json(rules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
 
/**
 * Reveals a hint for the current session.
 * Request body: { sessionId, hintOrder }
 * Deducts 15 coins for the 1st hint, 20 for the 2nd+ hint.
 * Reads and writes the coin balance from the DB.
 */
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
 
    // Enforce difficulty-specific hint limits: Easy = 1, Medium = 2, Hard = 3
    const maxAllowed = session.difficulty === 'EASY' ? 1 : session.difficulty === 'MEDIUM' ? 2 : 3;
    if ((session.hintsPurchasedCount ?? 0) >= maxAllowed) {
      res.status(400).json({ success: false, message: 'HINT_LIMIT_REACHED' });
      return;
    }
 
    const cost = hintOrder === 1 ? 15 : 20;
 
    // Read coin balance from DB
    const coinRow = await prisma.gameCoins.findFirst();
    const currentBalance = coinRow?.balance ?? 100;
 
    if (currentBalance < cost) {
      res.status(400).json({ success: false, message: 'INSUFFICIENT_COINS', cost, balance: currentBalance });
      return;
    }
 
    // Deduct coins in DB
    const newBalance = currentBalance - cost;
    if (coinRow) {
      await prisma.gameCoins.update({ where: { id: coinRow.id }, data: { balance: newBalance } });
    } else {
      await prisma.gameCoins.create({ data: { balance: newBalance } });
    }
 
    // Increment hint purchased count
    session.hintsPurchasedCount = (session.hintsPurchasedCount ?? 0) + 1;
 
    // Calculate hint text
    let hintText = '';
    const nextStepIdx = session.cutHistory.length;
 
    if (nextStepIdx >= session.totalCutsNeeded) {
      hintText = 'Defusal already complete. No further hints required.';
    } else {
      const correctIdx = session.correctSequence[nextStepIdx];
      const correctWire = session.wires[correctIdx];
 
      if (hintOrder === 1) {
        // Hint 1: cryptic/50-50 choice
        // Find all other wires in the junction box that have a different color than the correct wire
        const otherWires = session.wires.filter(w => w.color !== correctWire.color);
        // If there are no other wires (fallback), just fallback to correct wire
        const incorrectColor = otherWires.length > 0 
          ? otherWires[Math.floor(Math.random() * otherWires.length)].color 
          : 'GREEN';
        
        // Randomly shuffle the display order of the two colors so correct isn't always first
        const choices = [correctWire.color, incorrectColor].sort(() => Math.random() - 0.5);
 
        if (session.difficulty === 'EASY') {
          hintText = `DECRYPTION HINT (HINT 1): The target wire to stabilize the junction is either ${choices[0]} or ${choices[1]}.`;
        } else {
          hintText = `DECRYPTION HINT (HINT 1): Step ${nextStepIdx + 1} of your defusal sequence requires cutting either the ${choices[0]} or the ${choices[1]} wire.`;
        }
      } else {
        // Hint 2+: direct solution (easier than Hint 1)
        if (session.difficulty === 'EASY') {
          hintText = `DIRECT SOLUTION (HINT 2): Sever the ${correctWire.color} wire immediately.`;
        } else {
          hintText = `DIRECT SOLUTION (HINT 2): Step ${nextStepIdx + 1} of your defusal sequence requires cutting the ${correctWire.color} wire.`;
        }
      }
    }
 
    res.status(200).json({ success: true, hintText, cost, balance: newBalance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
 