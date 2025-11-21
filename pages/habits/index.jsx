import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pencil, Trash2, Plus } from 'lucide-react'

const index = () => {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    reason: '',
    duration: '',
    reward: ''
  })

  // Fetch habits from MongoDB
  const fetchHabits = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/habits')
      if (response.ok) {
        const data = await response.json()
        setHabits(data)
      }
    } catch (error) {
      console.error('Error fetching habits:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHabits()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (value) => {
    setFormData(prev => ({
      ...prev,
      duration: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.reason || !formData.duration || !formData.reward) {
      alert('Please fill in all fields')
      return
    }

    try {
      if (editingHabit) {
        // Update existing habit
        const response = await fetch(`/api/habits/${editingHabit._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          await fetchHabits()
          resetForm()
        }
      } else {
        // Create new habit
        const response = await fetch('/api/habits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          await fetchHabits()
          resetForm()
        }
      }
    } catch (error) {
      console.error('Error saving habit:', error)
    }
  }

  const handleEdit = (habit) => {
    setEditingHabit(habit)
    setFormData({
      name: habit.name,
      reason: habit.reason,
      duration: habit.duration,
      reward: habit.reward
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      try {
        const response = await fetch(`/api/habits/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchHabits()
        }
      } catch (error) {
        console.error('Error deleting habit:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      reason: '',
      duration: '',
      reward: ''
    })
    setEditingHabit(null)
    setDialogOpen(false)
  }

  const getDurationLabel = (duration) => {
    const labels = {
      '15day': '15 Days',
      '1month': '1 Month',
      '3month': '3 Months',
      '6month': '6 Months',
      '1year': '1 Year'
    }
    return labels[duration] || duration
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Habits</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingHabit ? 'Edit Habit' : 'Add New Habit'}</DialogTitle>
              <DialogDescription>
                {editingHabit ? 'Update your habit details below.' : 'Fill in the details to create a new habit.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter habit name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="reason" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Reason
                  </label>
                  <Textarea
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    placeholder="Why do you want to build this habit?"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="duration" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Duration
                  </label>
                  <Select value={formData.duration} onValueChange={handleSelectChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15day">15 Days</SelectItem>
                      <SelectItem value="1month">1 Month</SelectItem>
                      <SelectItem value="3month">3 Months</SelectItem>
                      <SelectItem value="6month">6 Months</SelectItem>
                      <SelectItem value="1year">1 Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="reward" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Reward
                  </label>
                  <Input
                    id="reward"
                    name="reward"
                    value={formData.reward}
                    onChange={handleChange}
                    placeholder="What's your reward for completing this habit?"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingHabit ? 'Update' : 'Add'} Habit
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading habits...</div>
      ) : habits.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No habits yet. Click "Add Habit" to get started!
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {habits.map((habit) => (
                <TableRow key={habit._id}>
                  <TableCell className="font-medium">{habit.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{habit.reason}</TableCell>
                  <TableCell>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {getDurationLabel(habit.duration)}
                    </span>
                  </TableCell>
                  <TableCell>{habit.reward}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(habit)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(habit._id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export default index
