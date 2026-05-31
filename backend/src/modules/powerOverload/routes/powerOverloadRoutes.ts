import express from 'express';
import { getNewGame, checkWire, getManual, getHint } from '../controllers/powerOverloadController.js';
import {
  listAllRules,
  listRulesByDifficulty,
  getRule,
  createRule,
  updateRule,
  deleteRule,
} from '../controllers/rulesController.js';
import {
  listAllTemplates,
  getTemplateByDifficulty,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/templatesController.js';

const router = express.Router();

// ─── Game session ─────────────────────────────────────────────────────────────
router.post('/start', getNewGame);
router.post('/cut', checkWire);
router.post('/cut-wire', checkWire);
router.post('/hint', getHint);

/** GET /api/game/manual?difficulty=EASY — rules by difficulty (game UI) */
router.get('/manual', getManual);

// ─── decoding_rules CRUD ──────────────────────────────────────────────────────
router.get('/rules/by-difficulty', listRulesByDifficulty);
router.get('/rules', listAllRules);
router.get('/rules/:id', getRule);
router.post('/rules', createRule);
router.put('/rules/:id', updateRule);
router.delete('/rules/:id', deleteRule);

// ─── critical_templates CRUD ──────────────────────────────────────────────────
router.get('/templates/by-difficulty', getTemplateByDifficulty);
router.get('/templates', listAllTemplates);
router.get('/templates/:id', getTemplate);
router.post('/templates', createTemplate);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);

export default router;
