import { Router } from 'express';
import simonSaysRouter from './modules/simon-says/routers';

const router = Router();

router.use('/simon-says/scores', simonSaysRouter);

export default router;
