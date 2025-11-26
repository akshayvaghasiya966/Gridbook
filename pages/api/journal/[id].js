import { getJournalById, updateJournalEntry, deleteJournalEntry } from '@/controllers/journalController'
import { authenticate } from '@/middleware/auth'

export default authenticate(async function handler(req, res) {
  if (req.method === 'GET') {
    return getJournalById(req, res)
  }

  if (req.method === 'PUT') {
    return updateJournalEntry(req, res)
  }

  if (req.method === 'DELETE') {
    return deleteJournalEntry(req, res)
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
})

