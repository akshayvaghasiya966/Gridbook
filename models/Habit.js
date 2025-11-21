import mongoose from 'mongoose'

const habitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Habit name is required'],
      trim: true,
      maxlength: [100, 'Habit name cannot exceed 100 characters'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      enum: {
        values: ['15day', '1month', '3month', '6month', '1year'],
        message: 'Duration must be one of: 15day, 1month, 3month, 6month, 1year',
      },
    },
    reward: {
      type: String,
      required: [true, 'Reward is required'],
      trim: true,
      maxlength: [200, 'Reward cannot exceed 200 characters'],
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically
  }
)

// Prevent model recompilation during development
const Habit = mongoose.models.Habit || mongoose.model('Habit', habitSchema)

export default Habit

