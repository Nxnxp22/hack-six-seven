import { Router } from 'express'
import * as controller from '../controllers/passwordPuzzle.controller'

const router = Router()

router.get('/stability',  controller.getStability)
router.get('/',           controller.getAll)
router.post('/',          controller.createPuzzle)
router.get('/random',     controller.getRandom)
router.post('/hint',      controller.revealHint)
router.post('/submit',    controller.submit)
router.get('/:id',        controller.getById)
router.patch('/:id',      controller.updatePuzzle)
router.delete('/:id',     controller.deletePuzzle)

export default router
