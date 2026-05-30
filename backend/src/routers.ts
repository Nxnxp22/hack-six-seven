import express from 'express';
import powerOverloadRouter from './modules/powerOverload/routes/powerOverloadRoutes.js';
import stabilityRouter from './modules/stability/stabilityRoutes.js';

const router = express.Router();

// Mount power overload router under /game
router.use('/game', powerOverloadRouter);

// Mount stability router under /stability
router.use('/stability', stabilityRouter);

export default router;

