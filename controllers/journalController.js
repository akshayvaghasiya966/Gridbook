import mongoose from 'mongoose'
import Journal from '@/models/Journal'
import connectDB from '@/lib/mongodb'

// Get all journal entries
export const getAllJournalEntries = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    const entries = await Journal.find({ user: userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(100) // Get last 100 entries
    
    return res.status(200).json(entries)
  } catch (error) {
    console.error('Error fetching journal entries:', error)
    return res.status(500).json({ error: 'Failed to fetch journal entries' })
  }
}

// Get a single journal entry by ID
export const getJournalById = async (req, res) => {
  try {
    await connectDB()
    const { id } = req.query

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid journal entry ID' })
    }

    const entry = await Journal.findById(id)

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' })
    }

    return res.status(200).json(entry)
  } catch (error) {
    console.error('Error fetching journal entry:', error)
    return res.status(500).json({ error: 'Failed to fetch journal entry' })
  }
}

// Create a new journal entry
export const createJournalEntry = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { date, title, content, mood, tags } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Validation
    if (!date || !title || !content) {
      return res.status(400).json({ error: 'Date, title, and content are required' })
    }

    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    const newEntry = new Journal({
      user: userId,
      date: dateObj,
      title: title.trim(),
      content: content.trim(),
      mood: mood || 'neutral',
      tags: tags && Array.isArray(tags) ? tags.filter(tag => tag.trim()).slice(0, 10) : [],
    })

    const savedEntry = await newEntry.save()
    
    return res.status(201).json(savedEntry)
  } catch (error) {
    console.error('Error creating journal entry:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ error: errors.join(', ') })
    }

    return res.status(500).json({ error: 'Failed to create journal entry' })
  }
}

// Update a journal entry
export const updateJournalEntry = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { id } = req.query
    const { date, title, content, mood, tags } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid journal entry ID' })
    }

    // Validation
    if (!date || !title || !content) {
      return res.status(400).json({ error: 'Date, title, and content are required' })
    }

    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    const updatedEntry = await Journal.findOneAndUpdate(
      { _id: id, user: userId },
      {
        date: dateObj,
        title: title.trim(),
        content: content.trim(),
        mood: mood || 'neutral',
        tags: tags && Array.isArray(tags) ? tags.filter(tag => tag.trim()).slice(0, 10) : [],
      },
      {
        new: true,
        runValidators: true,
      }
    )

    if (!updatedEntry) {
      return res.status(404).json({ error: 'Journal entry not found' })
    }

    return res.status(200).json(updatedEntry)
  } catch (error) {
    console.error('Error updating journal entry:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ error: errors.join(', ') })
    }

    return res.status(500).json({ error: 'Failed to update journal entry' })
  }
}

// Delete a journal entry
export const deleteJournalEntry = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { id } = req.query

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid journal entry ID' })
    }

    const entry = await Journal.findOneAndDelete({ _id: id, user: userId })

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' })
    }

    return res.status(200).json({ message: 'Journal entry deleted successfully', entry })
  } catch (error) {
    console.error('Error deleting journal entry:', error)
    return res.status(500).json({ error: 'Failed to delete journal entry' })
  }
}

