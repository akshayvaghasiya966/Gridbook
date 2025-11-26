import { getFormulaById, updateFormula, deleteFormula } from '@/controllers/formulaController'
import { authenticate } from '@/middleware/auth'

export default authenticate(async function handler(req, res) {
  if (req.method === 'GET') {
    return getFormulaById(req, res)
  }

  if (req.method === 'PUT') {
    return updateFormula(req, res)
  }

  if (req.method === 'DELETE') {
    return deleteFormula(req, res)
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
})

