import mongoose from 'mongoose'
import Habit from '@/models/Habit'
import connectDB from '@/lib/mongodb'

// Get all habits
export const getAllHabits = async (req, res) => {
  try {
    await connectDB()
    const habits = await Habit.find({}).sort({ createdAt: -1 })
    return res.status(200).json(habits)
  } catch (error) {
    console.error('Error fetching habits:', error)
    return res.status(500).json({ error: 'Failed to fetch habits' })
  }
}

// Get a single habit by ID
export const getHabitById = async (req, res) => {
  try {
    await connectDB()
    const { id } = req.query

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid habit ID' })
    }

    const habit = await Habit.findById(id)

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    return res.status(200).json(habit)
  } catch (error) {
    console.error('Error fetching habit:', error)
    return res.status(500).json({ error: 'Failed to fetch habit' })
  }
}

// Create a new habit
export const createHabit = async (req, res) => {
  try {
    await connectDB()
    const { name, reason, duration, reward } = req.body

    // Validation
    if (!name || !reason || !duration || !reward) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const habit = new Habit({
      name,
      reason,
      duration,
      reward,
    })

    const savedHabit = await habit.save()
    return res.status(201).json(savedHabit)
  } catch (error) {
    console.error('Error creating habit:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ error: errors.join(', ') })
    }

    return res.status(500).json({ error: 'Failed to create habit' })
  }
}

// Update a habit
export const updateHabit = async (req, res) => {
  try {
    await connectDB()
    const { id } = req.query
    const { name, reason, duration, reward } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid habit ID' })
    }

    // Validation
    if (!name || !reason || !duration || !reward) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const habit = await Habit.findByIdAndUpdate(
      id,
      {
        name,
        reason,
        duration,
        reward,
      },
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
      }
    )

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    return res.status(200).json(habit)
  } catch (error) {
    console.error('Error updating habit:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ error: errors.join(', ') })
    }

    return res.status(500).json({ error: 'Failed to update habit' })
  }
}

// Delete a habit
export const deleteHabit = async (req, res) => {
  try {
    await connectDB()
    const { id } = req.query

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid habit ID' })
    }

    const habit = await Habit.findByIdAndDelete(id)

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    return res.status(200).json({ message: 'Habit deleted successfully', habit })
  } catch (error) {
    console.error('Error deleting habit:', error)
    return res.status(500).json({ error: 'Failed to delete habit' })
  }
}

