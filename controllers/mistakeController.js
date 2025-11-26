import mongoose from 'mongoose'
import Mistake from '@/models/Mistake'
import connectDB from '@/lib/mongodb'

// Get all mistakes
export const getAllMistakes = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    const mistakes = await Mistake.find({ user: userId }).sort({ createdAt: -1 })
    
    return res.status(200).json(mistakes)
  } catch (error) {
    console.error('Error fetching mistakes:', error)
    return res.status(500).json({ error: 'Failed to fetch mistakes' })
  }
}

// Get a single mistake by ID
export const getMistakeById = async (req, res) => {
  try {
    await connectDB()
    const { id } = req.query

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid mistake ID' })
    }

    const mistake = await Mistake.findById(id)

    if (!mistake) {
      return res.status(404).json({ error: 'Mistake not found' })
    }

    return res.status(200).json(mistake)
  } catch (error) {
    console.error('Error fetching mistake:', error)
    return res.status(500).json({ error: 'Failed to fetch mistake' })
  }
}

// Create a new mistake
export const createMistake = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { mistake, reason, solution } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Validation
    if (!mistake || !reason || !solution) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const newMistake = new Mistake({
      user: userId,
      mistake,
      reason,
      solution,
    })

    const savedMistake = await newMistake.save()
    
    return res.status(201).json(savedMistake)
  } catch (error) {
    console.error('Error creating mistake:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ error: errors.join(', ') })
    }

    return res.status(500).json({ error: 'Failed to create mistake' })
  }
}

// Update a mistake
export const updateMistake = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { id } = req.query
    const { mistake, reason, solution } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid mistake ID' })
    }

    // Validation
    if (!mistake || !reason || !solution) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const updatedMistake = await Mistake.findOneAndUpdate(
      { _id: id, user: userId },
      {
        mistake,
        reason,
        solution,
      },
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
      }
    )

    if (!updatedMistake) {
      return res.status(404).json({ error: 'Mistake not found' })
    }

    return res.status(200).json(updatedMistake)
  } catch (error) {
    console.error('Error updating mistake:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ error: errors.join(', ') })
    }

    return res.status(500).json({ error: 'Failed to update mistake' })
  }
}

// Delete a mistake
export const deleteMistake = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { id } = req.query

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid mistake ID' })
    }

    const mistake = await Mistake.findOneAndDelete({ _id: id, user: userId })

    if (!mistake) {
      return res.status(404).json({ error: 'Mistake not found' })
    }

    return res.status(200).json({ message: 'Mistake deleted successfully', mistake })
  } catch (error) {
    console.error('Error deleting mistake:', error)
    return res.status(500).json({ error: 'Failed to delete mistake' })
  }
}

