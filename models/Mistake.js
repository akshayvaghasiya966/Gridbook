import mongoose from 'mongoose'

const mistakeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    mistake: {
      type: String,
      required: [true, 'Mistake description is required'],
      trim: true,
      maxlength: [500, 'Mistake description cannot exceed 500 characters'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
    },
    solution: {
      type: String,
      required: [true, 'Solution is required'],
      trim: true,
      maxlength: [1000, 'Solution cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically
  }
)

// Prevent model recompilation during development
const Mistake = mongoose.models.Mistake || mongoose.model('Mistake', mistakeSchema)

export default Mistake

