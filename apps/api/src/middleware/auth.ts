import { auth } from '../lib/auth.js'
import express from 'express'

export const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    // Convert Express headers (IncomingHttpHeaders) to standard Fetch Headers for Better Auth compatibility
    const session = await auth.api.getSession({ headers: new Headers(req.headers as any) })
    if (!session) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No active session found.' 
      })
    }
    
    // Attach user and session to request for downstream use.
    // Note: We'd typically extend the Express Request interface for this in a separate types file.
    (req as any).user = session.user;
    (req as any).session = session;
    
    next()
  } catch (err) {
    console.error('Auth middleware error:', err)
    res.status(500).json({ error: 'Auth failed', message: 'An internal error occurred during authentication.' })
  }
}
