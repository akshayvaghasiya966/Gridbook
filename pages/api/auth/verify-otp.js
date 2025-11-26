import { verifyOTP } from '@/controllers/authController'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return verifyOTP(req, res)
  }

  res.setHeader('Allow', ['POST'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
}

