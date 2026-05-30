import express from 'express';
import { getNewGame, checkWire, getManual } from '../controllers/powerOverloadController.js';

const router = express.Router();

/**
 * @route   POST /api/game/start
 * @desc    Initializes a new game session and returns initial state
 */
router.post('/start', getNewGame);

/**
 * @route   GET /api/game/manual
 * @desc    Fetches the decoding rules from the SQLite 'decoding_rules' table
 */
router.get('/manual', getManual);

router.post('/cut', checkWire);
router.post('/cut-wire', checkWire);

export default router;