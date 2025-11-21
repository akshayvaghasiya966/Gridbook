import mongoose from 'mongoose'

const habitTrackingSchema = new mongoose.Schema(
  {
    habit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: [true, 'Habit reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    isDone: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient queries
habitTrackingSchema.index({ habit: 1, date: 1 }, { unique: true })

// Prevent model recompilation during development
const HabitTracking = mongoose.models.HabitTracking || mongoose.model('HabitTracking', habitTrackingSchema)

export default HabitTracking

