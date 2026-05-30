import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import router from './routers'
import { errorHandler } from './middlewares/error_handler'

const app = express()
const PORT = process.env.PORT ?? 3000

app.disable('x-powered-by')
app.use(cors({ origin: process.env.ALLOW_ORIGIN }))
app.use(express.json())

app.use('/api', router)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
