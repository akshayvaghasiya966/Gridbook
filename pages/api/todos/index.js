import { getAllTodos, createTodo } from '@/controllers/todoController'
import { authenticate } from '@/middleware/auth'

export default authenticate(async function handler(req, res) {
  if (req.method === 'GET') {
    return getAllTodos(req, res)
  }

  if (req.method === 'POST') {
    return createTodo(req, res)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
})

