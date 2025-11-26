import { getAllFinanceTransactions, createFinanceTransaction } from '@/controllers/financeController'
import { authenticate } from '@/middleware/auth'

export default authenticate(async function handler(req, res) {
  if (req.method === 'GET') {
    return getAllFinanceTransactions(req, res)
  }

  if (req.method === 'POST') {
    return createFinanceTransaction(req, res)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
})

