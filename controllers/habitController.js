import mongoose from 'mongoose'
import Habit from '@/models/Habit'
import HabitTracking from '@/models/HabitTracking'
import connectDB from '@/lib/mongodb'

// Helper function to get last 5 days tracking
const getLast5Days = async (habit) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const last5Days = []
  
  // Get last 5 days (including today)
  for (let i = 4; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(date)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const entry = await HabitTracking.findOne({
      habit: habit._id,
      date: {
        $gte: date,
        $lt: tomorrow,
      },
    })
    
    if (entry) {
      last5Days.push({
        date: date.toISOString(),
        isDone: entry.isDone,
        hasEntry: true,
      })
    } else {
      // Check if this date is in the future
      const isFuture = date > today
      last5Days.push({
        date: date.toISOString(),
        isDone: false,
        hasEntry: false,
        isFuture: isFuture,
      })
    }
  }
  
  return last5Days
}

// Helper function to calculate consistency for a habit
const calculateConsistency = async (habit) => {
  const startDate = new Date(habit.startDate || habit.createdAt)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  startDate.setHours(0, 0, 0, 0)

  const durationMap = {
    '15day': 15,
    '1month': 30,
    '3month': 90,
    '6month': 180,
    '1year': 365,
  }

  const maxDays = durationMap[habit.duration] || 0
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + maxDays)

  // Calculate days elapsed (from start to today, but not beyond end date)
  const effectiveEndDate = today < endDate ? today : endDate
  const daysElapsed = Math.floor((effectiveEndDate - startDate) / (1000 * 60 * 60 * 24)) + 1

  if (daysElapsed <= 0) {
    return { consistency: 0, daysCompleted: 0, daysElapsed: 0 }
  }

  // Get all tracking entries for this habit within validity period
  const allTracking = await HabitTracking.find({
    habit: habit._id,
    date: {
      $gte: startDate,
      $lte: effectiveEndDate,
    },
  })

  // Count completed days
  const daysCompleted = allTracking.filter(entry => entry.isDone === true).length

  // Calculate consistency percentage
  const consistency = (daysCompleted / daysElapsed) * 100

  return {
    consistency: Math.round(consistency * 100) / 100, // Round to 2 decimal places
    daysCompleted,
    daysElapsed,
  }
}

// Get all habits with consistency
export const getAllHabits = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    const habits = await Habit.find({ user: userId }).sort({ createdAt: -1 })
    
    // Calculate consistency and last 5 days for each habit
    const habitsWithConsistency = await Promise.all(
      habits.map(async (habit) => {
        const consistencyData = await calculateConsistency(habit)
        const last5Days = await getLast5Days(habit)
        return {
          ...habit.toObject(),
          consistency: consistencyData.consistency,
          daysCompleted: consistencyData.daysCompleted,
          daysElapsed: consistencyData.daysElapsed,
          last5Days: last5Days,
        }
      })
    )
    
    return res.status(200).json(habitsWithConsistency)
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

    const consistencyData = await calculateConsistency(habit)
    const last5Days = await getLast5Days(habit)
    const habitWithConsistency = {
      ...habit.toObject(),
      consistency: consistencyData.consistency,
      daysCompleted: consistencyData.daysCompleted,
      daysElapsed: consistencyData.daysElapsed,
      last5Days: last5Days,
    }

    return res.status(200).json(habitWithConsistency)
  } catch (error) {
    console.error('Error fetching habit:', error)
    return res.status(500).json({ error: 'Failed to fetch habit' })
  }
}

// Create a new habit
export const createHabit = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { name, reason, duration, reward } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Validation
    if (!name || !reason || !duration || !reward) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const habit = new Habit({
      user: userId,
      name,
      reason,
      duration,
      reward,
    })

    const savedHabit = await habit.save()
    const consistencyData = await calculateConsistency(savedHabit)
    const last5Days = await getLast5Days(savedHabit)
    
    return res.status(201).json({
      ...savedHabit.toObject(),
      consistency: consistencyData.consistency,
      daysCompleted: consistencyData.daysCompleted,
      daysElapsed: consistencyData.daysElapsed,
      last5Days: last5Days,
    })
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
    const userId = req.userId
    const { id } = req.query
    const { name, reason, duration, reward } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid habit ID' })
    }

    // Validation
    if (!name || !reason || !duration || !reward) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const habit = await Habit.findOneAndUpdate(
      { _id: id, user: userId },
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

    const consistencyData = await calculateConsistency(habit)
    const last5Days = await getLast5Days(habit)
    
    return res.status(200).json({
      ...habit.toObject(),
      consistency: consistencyData.consistency,
      daysCompleted: consistencyData.daysCompleted,
      daysElapsed: consistencyData.daysElapsed,
      last5Days: last5Days,
    })
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
    const userId = req.userId
    const { id } = req.query

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid habit ID' })
    }

    const habit = await Habit.findOneAndDelete({ _id: id, user: userId })

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    return res.status(200).json({ message: 'Habit deleted successfully', habit })
  } catch (error) {
    console.error('Error deleting habit:', error)
    return res.status(500).json({ error: 'Failed to delete habit' })
  }
}
