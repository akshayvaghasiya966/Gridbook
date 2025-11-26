import mongoose from 'mongoose'
import Finance from '@/models/Finance'
import connectDB from '@/lib/mongodb'

// Helper function to calculate summary statistics
const calculateSummary = async (userId, startDate, endDate) => {
  const transactions = await Finance.find({
    user: userId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  })

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const balance = income - expenses

  return {
    income: Math.round(income * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
    balance: Math.round(balance * 100) / 100,
    transactionCount: transactions.length,
  }
}

// Get all finance transactions with summary
export const getAllFinanceTransactions = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    // Get transactions
    const transactions = await Finance.find({ user: userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(200) // Get last 200 transactions
    
    // Calculate monthly summary (current month)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    
    const monthlySummary = await calculateSummary(userId, monthStart, monthEnd)
    
    // Calculate total summary (all time)
    const totalSummary = await calculateSummary(userId, new Date(0), new Date())
    
    return res.status(200).json({
      transactions,
      monthlySummary,
      totalSummary,
    })
  } catch (error) {
    console.error('Error fetching finance transactions:', error)
    return res.status(500).json({ error: 'Failed to fetch finance transactions' })
  }
}

// Get a single transaction by ID
export const getFinanceById = async (req, res) => {
  try {
    await connectDB()
    const { id } = req.query

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid transaction ID' })
    }

    const transaction = await Finance.findById(id)

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    return res.status(200).json(transaction)
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return res.status(500).json({ error: 'Failed to fetch transaction' })
  }
}

// Create a new transaction
export const createFinanceTransaction = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { date, type, category, amount, description } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Validation
    if (!date || !type || !category || amount === undefined) {
      return res.status(400).json({ error: 'Date, type, category, and amount are required' })
    }

    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: 'Type must be either income or expense' })
    }

    if (amount < 0) {
      return res.status(400).json({ error: 'Amount cannot be negative' })
    }

    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    const newTransaction = new Finance({
      user: userId,
      date: dateObj,
      type,
      category: category.trim(),
      amount: parseFloat(amount),
      description: description ? description.trim() : '',
    })

    const savedTransaction = await newTransaction.save()
    
    // Get updated summary
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const monthlySummary = await calculateSummary(userId, monthStart, monthEnd)
    
    return res.status(201).json({
      transaction: savedTransaction,
      monthlySummary,
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ error: errors.join(', ') })
    }

    return res.status(500).json({ error: 'Failed to create transaction' })
  }
}

// Update a transaction
export const updateFinanceTransaction = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { id } = req.query
    const { date, type, category, amount, description } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid transaction ID' })
    }

    // Validation
    if (!date || !type || !category || amount === undefined) {
      return res.status(400).json({ error: 'Date, type, category, and amount are required' })
    }

    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: 'Type must be either income or expense' })
    }

    if (amount < 0) {
      return res.status(400).json({ error: 'Amount cannot be negative' })
    }

    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    const updatedTransaction = await Finance.findOneAndUpdate(
      { _id: id, user: userId },
      {
        date: dateObj,
        type,
        category: category.trim(),
        amount: parseFloat(amount),
        description: description ? description.trim() : '',
      },
      {
        new: true,
        runValidators: true,
      }
    )

    if (!updatedTransaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // Get updated summary
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const monthlySummary = await calculateSummary(userId, monthStart, monthEnd)

    return res.status(200).json({
      transaction: updatedTransaction,
      monthlySummary,
    })
  } catch (error) {
    console.error('Error updating transaction:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ error: errors.join(', ') })
    }

    return res.status(500).json({ error: 'Failed to update transaction' })
  }
}

// Delete a transaction
export const deleteFinanceTransaction = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { id } = req.query

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid transaction ID' })
    }

    const transaction = await Finance.findOneAndDelete({ _id: id, user: userId })

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // Get updated summary
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const monthlySummary = await calculateSummary(userId, monthStart, monthEnd)

    return res.status(200).json({ 
      message: 'Transaction deleted successfully', 
      transaction,
      monthlySummary,
    })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return res.status(500).json({ error: 'Failed to delete transaction' })
  }
}

