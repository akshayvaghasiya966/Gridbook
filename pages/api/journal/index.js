import { getAllJournalEntries, createJournalEntry } from '@/controllers/journalController'
import { authenticate } from '@/middleware/auth'

export default authenticate(async function handler(req, res) {
  if (req.method === 'GET') {
    return getAllJournalEntries(req, res)
  }

  if (req.method === 'POST') {
    return createJournalEntry(req, res)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
})

