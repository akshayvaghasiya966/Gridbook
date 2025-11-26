import { getTodayTracking, createDailyEntries } from '@/controllers/habitTrackingController'
import { authenticate } from '@/middleware/auth'

export default authenticate(async function handler(req, res) {
  if (req.method === 'GET') {
    return getTodayTracking(req, res)
  }

  if (req.method === 'POST') {
    return createDailyEntries(req, res)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
})

