import { Router } from 'express'
import * as controller from '../controllers/passwordPuzzle.controller'

const router = Router()

router.get('/random', controller.getRandom)
router.post('/hint', controller.revealHint)
router.post('/submit', controller.submit)

export default router
