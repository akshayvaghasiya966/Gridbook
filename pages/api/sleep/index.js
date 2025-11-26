import { getAllSleepEntries, createSleepEntry } from '@/controllers/sleepController'
import { authenticate } from '@/middleware/auth'

export default authenticate(async function handler(req, res) {
  if (req.method === 'GET') {
    return getAllSleepEntries(req, res)
  }

  if (req.method === 'POST') {
    return createSleepEntry(req, res)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
})

