import { Router } from 'express';
import * as scoreController from '../controllers/scoreController';

const router = Router();

router.post('/', scoreController.createScore);
router.get('/', scoreController.getAllScores);
router.get('/:id', scoreController.getScoreById);
router.patch('/:id', scoreController.updateScore);
router.delete('/:id', scoreController.deleteScore);

export default router;