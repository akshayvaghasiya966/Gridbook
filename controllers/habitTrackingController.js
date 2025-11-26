import mongoose from 'mongoose'
import HabitTracking from '@/models/HabitTracking'
import Habit from '@/models/Habit'
import connectDB from '@/lib/mongodb'

// Helper function to check if habit is still valid
const isHabitValid = (habit, date) => {
  const startDate = new Date(habit.startDate || habit.createdAt)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  startDate.setHours(0, 0, 0, 0)

  const daysDiff = Math.floor((checkDate - startDate) / (1000 * 60 * 60 * 24))

  const durationMap = {
    '15day': 15,
    '1month': 30,
    '3month': 90,
    '6month': 180,
    '1year': 365,
  }

  const maxDays = durationMap[habit.duration] || 0
  return daysDiff >= 0 && daysDiff < maxDays
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
    user: habit.user,
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

// Get today's tracking entries with consistency
export const getTodayTracking = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const tracking = await HabitTracking.find({
      user: userId,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .populate('habit')
      .sort({ createdAt: 1 })

    // Calculate consistency for each habit
    const trackingWithConsistency = await Promise.all(
      tracking.map(async (entry) => {
        const consistencyData = await calculateConsistency(entry.habit)
        return {
          ...entry.toObject(),
          consistency: consistencyData.consistency,
          daysCompleted: consistencyData.daysCompleted,
          daysElapsed: consistencyData.daysElapsed,
        }
      })
    )

    return res.status(200).json(trackingWithConsistency)
  } catch (error) {
    console.error('Error fetching today tracking:', error)
    return res.status(500).json({ error: 'Failed to fetch tracking' })
  }
}

// Update today's tracking entry
export const updateTodayTracking = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { id } = req.query
    const { isDone } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid tracking ID' })
    }

    // Get the tracking entry
    const tracking = await HabitTracking.findOne({ _id: id, user: userId }).populate('habit')
    if (!tracking) {
      return res.status(404).json({ error: 'Tracking entry not found' })
    }

    // Check if it's today's entry
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const trackingDate = new Date(tracking.date)
    trackingDate.setHours(0, 0, 0, 0)

    if (trackingDate.getTime() !== today.getTime()) {
      return res.status(400).json({ error: 'You can only update today\'s entries' })
    }

    // Update the entry
    tracking.isDone = isDone
    await tracking.save()

    return res.status(200).json(tracking)
  } catch (error) {
    console.error('Error updating tracking:', error)
    return res.status(500).json({ error: 'Failed to update tracking' })
  }
}

// Create daily entries for all valid habits (for cronjob)
export const createDailyEntries = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get all habits for the user
    const habits = await Habit.find({ user: userId })

    const createdEntries = []
    const skippedEntries = []

    for (const habit of habits) {
      // Check if habit is still valid
      if (!isHabitValid(habit, today)) {
        skippedEntries.push({
          habitId: habit._id,
          habitName: habit.name,
          reason: 'Habit duration expired',
        })
        continue
      }

      // Check if entry already exists for today
      const existingEntry = await HabitTracking.findOne({
        habit: habit._id,
        date: {
          $gte: today,
          $lt: tomorrow,
        },
      })

      if (existingEntry) {
        skippedEntries.push({
          habitId: habit._id,
          habitName: habit.name,
          reason: 'Entry already exists for today',
        })
        continue
      }

      // Create new entry
      const newEntry = new HabitTracking({
        user: userId,
        habit: habit._id,
        date: today,
        isDone: false,
      })

      await newEntry.save()
      createdEntries.push({
        habitId: habit._id,
        habitName: habit.name,
        entryId: newEntry._id,
      })
    }

    return res.status(200).json({
      message: 'Daily entries created',
      created: createdEntries,
      skipped: skippedEntries,
    })
  } catch (error) {
    console.error('Error creating daily entries:', error)
    return res.status(500).json({ error: 'Failed to create daily entries' })
  }
}

// Get tracking history for a habit
export const getHabitTrackingHistory = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { habitId } = req.query

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!mongoose.Types.ObjectId.isValid(habitId)) {
      return res.status(400).json({ error: 'Invalid habit ID' })
    }

    const tracking = await HabitTracking.find({ 
      user: userId,
      habit: habitId 
    })
      .sort({ date: -1 })
      .limit(30) // Last 30 entries

    return res.status(200).json(tracking)
  } catch (error) {
    console.error('Error fetching tracking history:', error)
    return res.status(500).json({ error: 'Failed to fetch tracking history' })
  }
}

