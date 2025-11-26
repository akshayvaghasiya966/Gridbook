import { getFinanceById, updateFinanceTransaction, deleteFinanceTransaction } from '@/controllers/financeController'
import { authenticate } from '@/middleware/auth'

export default authenticate(async function handler(req, res) {
  if (req.method === 'GET') {
    return getFinanceById(req, res)
  }

  if (req.method === 'PUT') {
    return updateFinanceTransaction(req, res)
  }

  if (req.method === 'DELETE') {
    return deleteFinanceTransaction(req, res)
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
})

