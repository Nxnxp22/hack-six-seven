import { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../shared/errors'

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.issues })
    return
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }

  console.error('[Unhandled error]', err)
  res.status(500).json({ error: 'Internal server error' })
}
