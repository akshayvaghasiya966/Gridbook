import mongoose from 'mongoose'

const journalSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },
    mood: {
      type: String,
      enum: {
        values: ['happy', 'sad', 'anxious', 'excited', 'calm', 'angry', 'grateful', 'neutral'],
        message: 'Mood must be one of: happy, sad, anxious, excited, calm, angry, grateful, neutral',
      },
      default: 'neutral',
    },
    tags: {
      type: [String],
      default: [],
      maxlength: [10, 'Cannot have more than 10 tags'],
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient queries
journalSchema.index({ user: 1, date: -1 })
journalSchema.index({ user: 1, createdAt: -1 })

// Prevent model recompilation during development
const Journal = mongoose.models.Journal || mongoose.model('Journal', journalSchema)

export default Journal

