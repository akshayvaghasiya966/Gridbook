import mongoose from 'mongoose'

const sleepSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    sleepTime: {
      type: String,
      required: [true, 'Sleep time is required'],
      // Format: HH:MM (24-hour format)
    },
    wakeTime: {
      type: String,
      required: [true, 'Wake time is required'],
      // Format: HH:MM (24-hour format)
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      // Duration in hours (e.g., 7.5 for 7 hours 30 minutes)
      min: [0, 'Duration cannot be negative'],
      max: [24, 'Duration cannot exceed 24 hours'],
    },
    quality: {
      type: String,
      enum: {
        values: ['excellent', 'good', 'fair', 'poor'],
        message: 'Quality must be one of: excellent, good, fair, poor',
      },
      default: 'good',
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient queries
sleepSchema.index({ user: 1, date: -1 })
sleepSchema.index({ user: 1, date: 1 })

// Prevent model recompilation during development
const Sleep = mongoose.models.Sleep || mongoose.model('Sleep', sleepSchema)

export default Sleep

