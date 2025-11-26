import { getMistakeById, updateMistake, deleteMistake } from '@/controllers/mistakeController'
import { authenticate } from '@/middleware/auth'

export default authenticate(async function handler(req, res) {
  if (req.method === 'GET') {
    return getMistakeById(req, res)
  }

  if (req.method === 'PUT') {
    return updateMistake(req, res)
  }

  if (req.method === 'DELETE') {
    return deleteMistake(req, res)
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
})

