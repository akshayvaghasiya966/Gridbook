import mongoose from 'mongoose'
import Formula from '@/models/Formula'
import connectDB from '@/lib/mongodb'

// Helper function to evaluate formula safely
const evaluateFormula = (formula, variables) => {
  try {
    // Create a safe evaluation context
    const context = {}
    
    // Add variables to context
    Object.keys(variables).forEach(key => {
      const value = parseFloat(variables[key])
      if (!isNaN(value)) {
        context[key] = value
      }
    })
    
    // Replace formula variables with their values
    let expression = formula
    Object.keys(context).forEach(key => {
      const regex = new RegExp(`\\b${key}\\b`, 'g')
      expression = expression.replace(regex, context[key])
    })
    
    // Only allow numbers, operators, and parentheses
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
      throw new Error('Invalid characters in formula')
    }
    
    // Evaluate the expression
    const result = Function(`"use strict"; return (${expression})`)()
    
    return {
      success: true,
      result: parseFloat(result.toFixed(2)),
      error: null
    }
  } catch (error) {
    return {
      success: false,
      result: null,
      error: error.message || 'Invalid formula'
    }
  }
}

// Get all formulas
export const getAllFormulas = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    const formulas = await Formula.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(100)
    
    // Return formulas without calculating results (results calculated on execution)
    return res.status(200).json(formulas)
  } catch (error) {
    console.error('Error fetching formulas:', error)
    return res.status(500).json({ error: 'Failed to fetch formulas' })
  }
}

// Get a single formula by ID
export const getFormulaById = async (req, res) => {
  try {
    await connectDB()
    const { id } = req.query

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid formula ID' })
    }

    const formula = await Formula.findById(id)

    if (!formula) {
      return res.status(404).json({ error: 'Formula not found' })
    }

    return res.status(200).json(formula)
  } catch (error) {
    console.error('Error fetching formula:', error)
    return res.status(500).json({ error: 'Failed to fetch formula' })
  }
}

// Create a new formula
export const createFormula = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { name, formula, variables } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Validation
    if (!name || !formula) {
      return res.status(400).json({ error: 'Name and formula are required' })
    }

    // Convert variables object to plain object (Mongoose Map will handle it)
    const variablesObj = {}
    if (variables && typeof variables === 'object') {
      Object.keys(variables).forEach(key => {
        // Store variable name as string (e.g., "Price", "Quantity")
        const varName = String(variables[key]).trim()
        if (varName) {
          variablesObj[key] = varName
        }
      })
    }

    // Validate formula syntax (don't calculate result on creation)
    // Result will be calculated when formula is executed
    const newFormula = new Formula({
      user: userId,
      name: name.trim(),
      formula: formula.trim(),
      variables: variablesObj, // Mongoose will convert this to Map automatically
      result: null,
    })

    const savedFormula = await newFormula.save()
    
    return res.status(201).json(savedFormula)
  } catch (error) {
    console.error('Error creating formula:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ error: errors.join(', ') })
    }

    return res.status(500).json({ error: 'Failed to create formula' })
  }
}

// Update a formula
export const updateFormula = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { id } = req.query
    const { name, formula, variables } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid formula ID' })
    }

    // Validation
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: 'Name cannot be empty' })
    }

    if (formula !== undefined && !formula.trim()) {
      return res.status(400).json({ error: 'Formula cannot be empty' })
    }

    const updateData = {}
    
    if (name !== undefined) updateData.name = name.trim()
    if (formula !== undefined) updateData.formula = formula.trim()
    
    // Convert variables object to plain object (Mongoose Map will handle it)
    if (variables !== undefined) {
      const variablesObj = {}
      if (variables && typeof variables === 'object') {
        Object.keys(variables).forEach(key => {
          // Store variable name as string (e.g., "Price", "Quantity")
          const varName = String(variables[key]).trim()
          if (varName) {
            variablesObj[key] = varName
          }
        })
      }
      updateData.variables = variablesObj // Mongoose will convert this to Map automatically
    }

    // Don't calculate result on update - result is calculated when formula is executed
    updateData.result = null

    const updatedFormula = await Formula.findOneAndUpdate(
      { _id: id, user: userId },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )

    if (!updatedFormula) {
      return res.status(404).json({ error: 'Formula not found' })
    }

    const calculation = evaluateFormula(updatedFormula.formula, Object.fromEntries(updatedFormula.variables || new Map()))
    
    return res.status(200).json({
      ...updatedFormula.toObject(),
      calculatedResult: calculation.result,
      calculationError: calculation.error
    })
  } catch (error) {
    console.error('Error updating formula:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ error: errors.join(', ') })
    }

    return res.status(500).json({ error: 'Failed to update formula' })
  }
}

// Delete a formula
export const deleteFormula = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { id } = req.query

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid formula ID' })
    }

    const formula = await Formula.findOneAndDelete({ _id: id, user: userId })

    if (!formula) {
      return res.status(404).json({ error: 'Formula not found' })
    }

    return res.status(200).json({ message: 'Formula deleted successfully', formula })
  } catch (error) {
    console.error('Error deleting formula:', error)
    return res.status(500).json({ error: 'Failed to delete formula' })
  }
}

