import mongoose from 'mongoose'
import Sleep from '@/models/Sleep'
import connectDB from '@/lib/mongodb'

// Helper function to calculate weekly average
const calculateWeeklyAverage = async (userId) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Get start of week (7 days ago)
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - 6) // Last 7 days including today
  
  const sleepEntries = await Sleep.find({
    user: userId,
    date: {
      $gte: weekStart,
      $lte: today,
    },
  }).sort({ date: -1 })
  
  if (sleepEntries.length === 0) {
    return { average: 0, totalHours: 0, days: 0, status: 'red' }
  }
  
  const totalHours = sleepEntries.reduce((sum, entry) => sum + entry.duration, 0)
  const average = totalHours / sleepEntries.length
  const status = average >= 8 ? 'green' : 'red'
  
  return {
    average: Math.round(average * 100) / 100, // Round to 2 decimal places
    totalHours: Math.round(totalHours * 100) / 100,
    days: sleepEntries.length,
    status,
  }
}

// Get all sleep entries
export const getAllSleepEntries = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    const sleepEntries = await Sleep.find({ user: userId })
      .sort({ date: -1 })
      .limit(30) // Get last 30 entries
    
    const weeklyStats = await calculateWeeklyAverage(userId)
    
    return res.status(200).json({
      entries: sleepEntries,
      weeklyStats,
    })
  } catch (error) {
    console.error('Error fetching sleep entries:', error)
    return res.status(500).json({ error: 'Failed to fetch sleep entries' })
  }
}

// Get a single sleep entry by ID
export const getSleepById = async (req, res) => {
  try {
    await connectDB()
    const { id } = req.query

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid sleep entry ID' })
    }

    const sleepEntry = await Sleep.findById(id)

    if (!sleepEntry) {
      return res.status(404).json({ error: 'Sleep entry not found' })
    }

    return res.status(200).json(sleepEntry)
  } catch (error) {
    console.error('Error fetching sleep entry:', error)
    return res.status(500).json({ error: 'Failed to fetch sleep entry' })
  }
}

// Create a new sleep entry
export const createSleepEntry = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { date, sleepTime, wakeTime, duration, quality, notes } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Validation
    if (!date || !sleepTime || !wakeTime || duration === undefined) {
      return res.status(400).json({ error: 'Date, sleep time, wake time, and duration are required' })
    }

    // Check if entry already exists for this date
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)
    const existingEntry = await Sleep.findOne({
      user: userId,
      date: {
        $gte: new Date(dateObj),
        $lt: new Date(dateObj.getTime() + 24 * 60 * 60 * 1000),
      },
    })

    if (existingEntry) {
      return res.status(400).json({ error: 'Sleep entry already exists for this date' })
    }

    const newSleepEntry = new Sleep({
      user: userId,
      date: dateObj,
      sleepTime,
      wakeTime,
      duration: parseFloat(duration),
      quality: quality || 'good',
      notes: notes || '',
    })

    const savedEntry = await newSleepEntry.save()
    const weeklyStats = await calculateWeeklyAverage(userId)
    
    return res.status(201).json({
      entry: savedEntry,
      weeklyStats,
    })
  } catch (error) {
    console.error('Error creating sleep entry:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ error: errors.join(', ') })
    }

    return res.status(500).json({ error: 'Failed to create sleep entry' })
  }
}

// Update a sleep entry
export const updateSleepEntry = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { id } = req.query
    const { date, sleepTime, wakeTime, duration, quality, notes } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid sleep entry ID' })
    }

    // Validation
    if (!date || !sleepTime || !wakeTime || duration === undefined) {
      return res.status(400).json({ error: 'Date, sleep time, wake time, and duration are required' })
    }

    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    const updatedEntry = await Sleep.findOneAndUpdate(
      { _id: id, user: userId },
      {
        date: dateObj,
        sleepTime,
        wakeTime,
        duration: parseFloat(duration),
        quality: quality || 'good',
        notes: notes || '',
      },
      {
        new: true,
        runValidators: true,
      }
    )

    if (!updatedEntry) {
      return res.status(404).json({ error: 'Sleep entry not found' })
    }

    const weeklyStats = await calculateWeeklyAverage(userId)
    
    return res.status(200).json({
      entry: updatedEntry,
      weeklyStats,
    })
  } catch (error) {
    console.error('Error updating sleep entry:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ error: errors.join(', ') })
    }

    return res.status(500).json({ error: 'Failed to update sleep entry' })
  }
}

// Delete a sleep entry
export const deleteSleepEntry = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { id } = req.query

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid sleep entry ID' })
    }

    const sleepEntry = await Sleep.findOneAndDelete({ _id: id, user: userId })

    if (!sleepEntry) {
      return res.status(404).json({ error: 'Sleep entry not found' })
    }

    const weeklyStats = await calculateWeeklyAverage(userId)

    return res.status(200).json({ 
      message: 'Sleep entry deleted successfully', 
      entry: sleepEntry,
      weeklyStats,
    })
  } catch (error) {
    console.error('Error deleting sleep entry:', error)
    return res.status(500).json({ error: 'Failed to delete sleep entry' })
  }
}

