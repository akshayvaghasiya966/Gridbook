import { getAllMistakes, createMistake } from '@/controllers/mistakeController'
import { authenticate } from '@/middleware/auth'

export default authenticate(async function handler(req, res) {
  if (req.method === 'GET') {
    return getAllMistakes(req, res)
  }

  if (req.method === 'POST') {
    return createMistake(req, res)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
})

