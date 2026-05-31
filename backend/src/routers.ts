import { Router } from 'express'
import passwordPuzzleRoutes from './modules/security-lockdown/routes/passwordPuzzle.routes'
import powerOverloadRouter from './modules/powerOverload/routes/powerOverloadRoutes'
import stabilityRouter from './modules/stability/stabilityRoutes'
import challengesRouter from './modules/comm-failure/routes/challenge.route'  

const router = Router()

router.use('/password-puzzle', passwordPuzzleRoutes)
router.use('/game', powerOverloadRouter)
router.use('/stability', stabilityRouter)
router.use('/challenges', challengesRouter)  

export default router