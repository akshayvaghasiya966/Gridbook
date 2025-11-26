import { getCurrentUser } from '@/controllers/authController'
import { authenticate } from '@/middleware/auth'

export default authenticate(async function handler(req, res) {
  if (req.method === 'GET') {
    return getCurrentUser(req, res)
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
})

