import mongoose from 'mongoose'
import Todo from '@/models/Todo'
import connectDB from '@/lib/mongodb'

// Get all todos
export const getAllTodos = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    const todos = await Todo.find({ user: userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(200) // Get last 200 todos
    
    return res.status(200).json(todos)
  } catch (error) {
    console.error('Error fetching todos:', error)
    return res.status(500).json({ error: 'Failed to fetch todos' })
  }
}

// Get a single todo by ID
export const getTodoById = async (req, res) => {
  try {
    await connectDB()
    const { id } = req.query

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid todo ID' })
    }

    const todo = await Todo.findById(id)

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' })
    }

    return res.status(200).json(todo)
  } catch (error) {
    console.error('Error fetching todo:', error)
    return res.status(500).json({ error: 'Failed to fetch todo' })
  }
}

// Create a new todo
export const createTodo = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { title, description, date, priority, dueDate } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Validation
    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const dateObj = date ? new Date(date) : new Date()
    dateObj.setHours(0, 0, 0, 0)

    const newTodo = new Todo({
      user: userId,
      title: title.trim(),
      description: description ? description.trim() : '',
      date: dateObj,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      completed: false,
    })

    const savedTodo = await newTodo.save()
    
    return res.status(201).json(savedTodo)
  } catch (error) {
    console.error('Error creating todo:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ error: errors.join(', ') })
    }

    return res.status(500).json({ error: 'Failed to create todo' })
  }
}

// Update a todo
export const updateTodo = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { id } = req.query
    const { title, description, date, completed, priority, dueDate } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid todo ID' })
    }

    // Validation
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ error: 'Title cannot be empty' })
    }

    const updateData = {}
    
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description ? description.trim() : ''
    if (date !== undefined) {
      const dateObj = new Date(date)
      dateObj.setHours(0, 0, 0, 0)
      updateData.date = dateObj
    }
    if (completed !== undefined) updateData.completed = completed
    if (priority !== undefined) updateData.priority = priority
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null

    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: id, user: userId },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )

    if (!updatedTodo) {
      return res.status(404).json({ error: 'Todo not found' })
    }

    return res.status(200).json(updatedTodo)
  } catch (error) {
    console.error('Error updating todo:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ error: errors.join(', ') })
    }

    return res.status(500).json({ error: 'Failed to update todo' })
  }
}

// Delete a todo
export const deleteTodo = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId
    const { id } = req.query

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid todo ID' })
    }

    const todo = await Todo.findOneAndDelete({ _id: id, user: userId })

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' })
    }

    return res.status(200).json({ message: 'Todo deleted successfully', todo })
  } catch (error) {
    console.error('Error deleting todo:', error)
    return res.status(500).json({ error: 'Failed to delete todo' })
  }
}

