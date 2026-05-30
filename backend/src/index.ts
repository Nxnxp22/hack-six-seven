import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import router from './routers'
import { errorHandler } from './middlewares/error_handler'

const app = express()
const PORT = process.env.PORT ?? 3000

app.disable('x-powered-by')
app.use(morgan('dev'))
app.use(cors({ origin: process.env.ALLOW_ORIGIN, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.use('/api', router)

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'healthy', system: 'nexus-core-backend' })
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
