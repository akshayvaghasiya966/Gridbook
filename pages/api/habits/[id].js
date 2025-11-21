import { getHabitById, updateHabit, deleteHabit } from '@/controllers/habitController'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getHabitById(req, res)
  }

  if (req.method === 'PUT') {
    return updateHabit(req, res)
  }

  if (req.method === 'DELETE') {
    return deleteHabit(req, res)
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
}
