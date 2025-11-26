import { getSleepById, updateSleepEntry, deleteSleepEntry } from '@/controllers/sleepController'
import { authenticate } from '@/middleware/auth'

export default authenticate(async function handler(req, res) {
  if (req.method === 'GET') {
    return getSleepById(req, res)
  }

  if (req.method === 'PUT') {
    return updateSleepEntry(req, res)
  }

  if (req.method === 'DELETE') {
    return deleteSleepEntry(req, res)
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
})

