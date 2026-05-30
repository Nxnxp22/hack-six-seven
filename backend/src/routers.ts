import { Router } from 'express'
import passwordPuzzleRoutes from './modules/security-lockdown/routes/passwordPuzzle.routes'

const router = Router()

router.use('/password-puzzle', passwordPuzzleRoutes)

export default router
