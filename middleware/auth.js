import { verifyToken } from '@/lib/jwt'

export const authenticate = (handler) => {
  return async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')

      if (!token) {
        return res.status(401).json({ error: 'No token provided' })
      }

      const decoded = verifyToken(token)

      if (!decoded || !decoded.userId) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      // Add userId to request object
      req.userId = decoded.userId

      return handler(req, res)
    } catch (error) {
      return res.status(401).json({ error: 'Authentication failed' })
    }
  }
}

