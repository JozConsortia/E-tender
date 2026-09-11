import cors from 'cors'
import express from 'express'
import dotenv from 'dotenv'
import api from './routes/index.js'

dotenv.config()

export const app = express()
app.use(cors({ origin: process.env.FRONTEND_ORIGIN?.split(',').map((v) => v.trim()) || 'http://localhost:5173' }))
app.use(express.json({ limit: '2mb' }))
app.get('/', (_req, res) => res.json({ name: 'AI e-Tendering API', version: '1.0.0', database: 'not connected yet' }))
app.use('/api', api)
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ message: 'Unexpected server error.' })
})
