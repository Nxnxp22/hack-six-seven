import express from 'express';
import powerOverloadRouter from './modules/powerOverload/routes/powerOverloadRoutes.js';

const router = express.Router();

// Mount power overload router under /game
router.use('/game', powerOverloadRouter);

export default router;
