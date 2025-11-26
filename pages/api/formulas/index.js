import { getAllFormulas, createFormula } from '@/controllers/formulaController'
import { authenticate } from '@/middleware/auth'

export default authenticate(async function handler(req, res) {
  if (req.method === 'GET') {
    return getAllFormulas(req, res)
  }

  if (req.method === 'POST') {
    return createFormula(req, res)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
})

