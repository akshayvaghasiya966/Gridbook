import { updateTodayTracking } from '@/controllers/habitTrackingController'

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    return updateTodayTracking(req, res)
  }

  res.setHeader('Allow', ['PUT'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
}

