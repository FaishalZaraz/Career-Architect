import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import 'dotenv/config'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.js'
import jobRoutes from './routes/jobs.js'
import analyticsRoutes from './routes/analytics.js'
import userRoutes from './routes/user.js'

const app = express()
const PORT = process.env.PORT || 4000

// Tell Express to trust the proxy (for secure cookies on Vercel)
app.set('trust proxy', true)

// Middleware
app.use(helmet())
app.use(morgan('dev'))

const allowedOrigins = [
  'http://localhost:3000',
  'https://career-architect-web.vercel.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))
app.use(express.json())

// Better Auth API Route
app.all('/api/auth/*', toNodeHandler(auth))

// Application Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Career Architect API is running', 
    status: 'online', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

app.use('/api/jobs', jobRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/user', userRoutes)

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error', message: err.message })
})

// Server initiation handled for Vercel serverless or local execution
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 JobTracker API running on http://localhost:${PORT}`)
  })
}

export default app
