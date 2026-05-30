import express from 'express';
import { getStability, applyStability, resetStability, getCoins, applyCoins } from './stabilityController.js';

const router = express.Router();

/** GET /api/stability — returns { modules: { moduleId, stability }[] } */
router.get('/', getStability);

/** POST /api/stability/apply — body: { moduleId, delta } */
router.post('/apply', applyStability);

/** POST /api/stability/reset — resets all to 100% and coins to 100 */
router.post('/reset', resetStability);

/** GET /api/stability/coins — returns { balance } */
router.get('/coins', getCoins);

/** POST /api/stability/coins/apply — body: { delta } */
router.post('/coins/apply', applyCoins);

export default router;
