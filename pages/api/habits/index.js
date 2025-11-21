import { getAllHabits, createHabit } from '@/controllers/habitController'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getAllHabits(req, res)
  }

  if (req.method === 'POST') {
    return createHabit(req, res)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
}
