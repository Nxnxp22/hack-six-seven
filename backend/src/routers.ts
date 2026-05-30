import { Router } from 'express'
import passwordPuzzleRoutes from './modules/security-lockdown/routes/passwordPuzzle.routes'
import powerOverloadRouter from './modules/powerOverload/routes/powerOverloadRoutes'
import stabilityRouter from './modules/stability/stabilityRoutes'

const router = Router()

router.use('/password-puzzle', passwordPuzzleRoutes)
router.use('/game', powerOverloadRouter)
router.use('/stability', stabilityRouter)

export default router
