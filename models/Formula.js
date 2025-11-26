import mongoose from 'mongoose'

const formulaSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    formula: {
      type: String,
      required: [true, 'Formula is required'],
      trim: true,
      maxlength: [500, 'Formula cannot exceed 500 characters'],
    },
    // Store variable display names as strings, keyed by variable symbol (a, b, c, ...)
    variables: {
      type: Map,
      of: String,
      default: {},
    },
    // Optional cached result
    result: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient queries
formulaSchema.index({ user: 1, createdAt: -1 })

// Force model recompilation during development so schema changes apply
if (mongoose.models.Formula) {
  delete mongoose.models.Formula
}

const Formula = mongoose.model('Formula', formulaSchema)

export default Formula

