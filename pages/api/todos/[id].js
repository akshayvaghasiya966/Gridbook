import { getTodoById, updateTodo, deleteTodo } from '@/controllers/todoController'
import { authenticate } from '@/middleware/auth'

export default authenticate(async function handler(req, res) {
  if (req.method === 'GET') {
    return getTodoById(req, res)
  }

  if (req.method === 'PUT') {
    return updateTodo(req, res)
  }

  if (req.method === 'DELETE') {
    return deleteTodo(req, res)
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
})

