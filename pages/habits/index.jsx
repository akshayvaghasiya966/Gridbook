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
import { Trash2, Plus, Check, TrendingUp, X, Minus, User, AlertTriangle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import LoginDialog from '@/components/auth/LoginDialog'
import Sidebar from '@/components/Sidebar'
import { useToast } from '@/hooks/use-toast'
import { getToken, getUser, clearAuth, getAuthHeaders } from '@/lib/auth'

const ITEMS_PER_PAGE = 5

const index = () => {
  const { toast } = useToast()
  const [habits, setHabits] = useState([])
  const [tracking, setTracking] = useState([])
  const [loading, setLoading] = useState(true)
  const [trackingLoading, setTrackingLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [habitToDelete, setHabitToDelete] = useState(null)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    reason: '',
    duration: '',
    reward: ''
  })

  // Check authentication on mount
  useEffect(() => {
    const token = getToken()
    const userData = getUser()
    
    if (token && userData) {
      setIsAuthenticated(true)
      setUser(userData)
      fetchHabits()
      fetchTodayTracking()
    } else {
      setLoginDialogOpen(true)
      setLoading(false)
    }
  }, [])

  // Fetch habits from MongoDB
  const fetchHabits = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/habits', {
        headers: getAuthHeaders(),
      })
      
      if (response.status === 401) {
        // Unauthorized - clear auth and show login
        clearAuth()
        setIsAuthenticated(false)
        setUser(null)
        setLoginDialogOpen(true)
        return
      }
      
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

  // Fetch today's tracking entries
  const fetchTodayTracking = async () => {
    try {
      setTrackingLoading(true)
      const response = await fetch('/api/habits/tracking', {
        headers: getAuthHeaders(),
      })
      
      if (response.status === 401) {
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setTracking(data)
      }
    } catch (error) {
      console.error('Error fetching tracking:', error)
    } finally {
      setTrackingLoading(false)
    }
  }

  const handleLoginSuccess = (token, userData) => {
    setIsAuthenticated(true)
    setUser(userData)
    setLoginDialogOpen(false)
    fetchHabits()
    fetchTodayTracking()
  }


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
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all fields",
      })
      return
    }

    try {
      // Create new habit
        const response = await fetch('/api/habits', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(formData),
        })

      if (response.ok) {
        await fetchHabits()
          // Create today's tracking entry for the new habit
          await fetch('/api/habits/tracking', { 
            method: 'POST',
            headers: getAuthHeaders(),
          })
        await fetchTodayTracking()
        setCurrentPage(1)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving habit:', error)
    }
  }

  const handleDeleteClick = (id) => {
    setHabitToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!habitToDelete) return

    try {
      const response = await fetch(`/api/habits/${habitToDelete}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        await fetchHabits()
        await fetchTodayTracking()
        setDeleteDialogOpen(false)
        setHabitToDelete(null)
      }
    } catch (error) {
      console.error('Error deleting habit:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      reason: '',
      duration: '',
      reward: ''
    })
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

  // Pagination calculations
  const totalPages = Math.ceil(habits.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedHabits = habits.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getConsistencyColor = (consistency) => {
    if (consistency >= 80) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    if (consistency >= 50) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
  }

  const handleToggleTracking = async (trackingId, currentStatus) => {
    try {
      const response = await fetch(`/api/habits/tracking/${trackingId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isDone: !currentStatus }),
      })

      if (response.ok) {
        await fetchTodayTracking()
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || 'Failed to update tracking',
        })
      }
    } catch (error) {
      console.error('Error updating tracking:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to update tracking',
      })
    }
  }

  const handleCreateDailyEntries = async () => {
    try {
      const response = await fetch('/api/habits/tracking', {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        await fetchTodayTracking()
        toast({
          variant: "success",
          title: "Success",
          description: "Daily entries created successfully!",
        })
      }
    } catch (error) {
      console.error('Error creating daily entries:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to create daily entries',
      })
    }
  }

  const renderLast5Days = (last5Days, size = 'md') => {
    const iconSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
    const iconInnerSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'
    const gapSize = size === 'sm' ? 'gap-1' : 'gap-1.5'
    
    if (!last5Days || last5Days.length === 0) {
      return (
        <div className={`flex ${gapSize} items-center`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className={`${iconSize} rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center`}
            >
              <Minus className={`${iconInnerSize} text-gray-400 dark:text-gray-500`} strokeWidth={2} />
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className={`flex ${gapSize} items-center`}>
        {last5Days.map((day, index) => {
          const isToday = new Date(day.date).toDateString() === new Date().toDateString()
          
          if (day.isFuture || !day.hasEntry) {
            // Future date or no entry - outlined gray
            return (
              <div
                key={index}
                className={`${iconSize} rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center ${
                  isToday ? 'ring-1 ring-primary' : ''
                }`}
                title={day.isFuture ? 'Future date' : 'No entry'}
              >
                <Minus className={`${iconInnerSize} text-gray-400 dark:text-gray-500`} strokeWidth={2} />
              </div>
            )
          } else if (day.isDone) {
            // Completed - solid green
            return (
              <div
                key={index}
                className={`${iconSize} rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center ${
                  isToday ? 'ring-1 ring-primary' : ''
                }`}
                title="Completed"
              >
                <Check className={`${iconInnerSize} text-white`} strokeWidth={2.5} />
              </div>
            )
          } else {
            // Not done - solid red
            return (
              <div
                key={index}
                className={`${iconSize} rounded-full bg-red-500 dark:bg-red-600 flex items-center justify-center ${
                  isToday ? 'ring-1 ring-primary' : ''
                }`}
                title="Not completed"
              >
                <X className={`${iconInnerSize} text-white`} strokeWidth={2.5} />
              </div>
            )
          }
        })}
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginDialog
          open={loginDialogOpen}
          onOpenChange={setLoginDialogOpen}
          onLoginSuccess={handleLoginSuccess}
        />
        <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h1 className="text-2xl font-bold mb-4">Welcome to Gridbook</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please sign in to access your habits
              </p>
              <Button onClick={() => setLoginDialogOpen(true)} size="lg">
                Sign In / Sign Up
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <LoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        onLoginSuccess={handleLoginSuccess}
      />
      <Sidebar>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">Habits</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Track and manage your daily habits
              {user && (
                <span className="ml-2 text-xs">• {user.email}</span>
              )}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()} size="lg" className="shadow-md flex-1 sm:flex-none">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Habit
                </Button>
              </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Habit</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new habit.
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
                  Add Habit
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
          </div>
        </div>

        {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading habits...</p>
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-md mx-auto px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No habits yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Get started by creating your first habit!</p>
            <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Habit
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Reason</TableHead>
                    <TableHead className="font-semibold">Duration</TableHead>
                    <TableHead className="font-semibold text-center">Last 5</TableHead>
                    <TableHead className="font-semibold text-center">Consistency</TableHead>
                    <TableHead className="font-semibold">Reward</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedHabits.map((habit) => {
                    const consistency = habit.consistency || 0
                    const daysCompleted = habit.daysCompleted || 0
                    const daysElapsed = habit.daysElapsed || 0
                    
                    return (
                      <TableRow key={habit._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                        <TableCell className="font-medium text-base">{habit.name}</TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate" title={habit.reason}>{habit.reason}</p>
                        </TableCell>
                        <TableCell>
                          <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                            {getDurationLabel(habit.duration)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {renderLast5Days(habit.last5Days, 'md')}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm flex items-center gap-1.5 ${getConsistencyColor(consistency)}`}>
                              <TrendingUp className="h-3.5 w-3.5" />
                              {consistency.toFixed(1)}%
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {daysCompleted}/{daysElapsed} days
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{habit.reward}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteClick(habit._id)}
                            className="h-9 w-9"
                            title="Delete habit"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {paginatedHabits.map((habit) => {
              const consistency = habit.consistency || 0
              const daysCompleted = habit.daysCompleted || 0
              const daysElapsed = habit.daysElapsed || 0
              
              return (
                <div key={habit._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow p-4">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex-1 pr-2">
                      <h3 className="font-semibold text-base mb-1 text-gray-900 dark:text-gray-100">{habit.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{habit.reason}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteClick(habit._id)}
                      className="h-7 w-7 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  
                  {/* Last 5 Days */}
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Last 5 Days</p>
                    <div className="flex items-center">
                      {renderLast5Days(habit.last5Days, 'sm')}
                    </div>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Duration</p>
                      <span className="inline-flex px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-medium border border-primary/20">
                        {getDurationLabel(habit.duration)}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Consistency</p>
                      <div className={`inline-flex px-2 py-0.5 rounded-md font-semibold text-xs items-center gap-1 ${getConsistencyColor(consistency)}`}>
                        <TrendingUp className="h-2.5 w-2.5" />
                        {consistency.toFixed(1)}%
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {daysCompleted}/{daysElapsed} days
                      </p>
                    </div>
                  </div>
                  
                  {/* Reward */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Reward</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1">{habit.reward}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 sm:mt-6 flex justify-center">
              <Pagination>
                <PaginationContent className="flex-wrap">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer min-w-10"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )
                    }
                    return null
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* Page info */}
          {habits.length > 0 && (
            <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2">
              Showing {startIndex + 1} to {Math.min(endIndex, habits.length)} of {habits.length} habits
            </div>
          )}
        </>
      )}

      {/* Today's Tracking Table */}
      <div className="mt-6 sm:mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">Today's Tracking</h2>
          <Button onClick={handleCreateDailyEntries} variant="outline" size="sm" className="w-full sm:w-auto">
            Create Today's Entries
          </Button>
        </div>

        {trackingLoading ? (
          <div className="text-center py-8">Loading tracking...</div>
        ) : tracking.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <p className="text-sm sm:text-base">No tracking entries for today. Click "Create Today's Entries" to generate entries for all valid habits.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Habit</TableHead>
                    <TableHead className="text-center">Consistency</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Done</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tracking.map((entry) => {
                    const consistency = entry.consistency || 0
                    const daysCompleted = entry.daysCompleted || 0
                    const daysElapsed = entry.daysElapsed || 0
                    
                    return (
                      <TableRow key={entry._id}>
                        <TableCell className="font-medium">
                          {entry.habit?.name || 'Unknown Habit'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-lg font-semibold ${
                              consistency >= 80 
                                ? 'text-green-600 dark:text-green-400' 
                                : consistency >= 50 
                                ? 'text-yellow-600 dark:text-yellow-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {consistency.toFixed(1)}%
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {daysCompleted}/{daysElapsed} days
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            entry.isDone 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {entry.isDone ? 'Completed' : 'Pending'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={entry.isDone}
                              onCheckedChange={() => handleToggleTracking(entry._id, entry.isDone)}
                              disabled={false}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {tracking.map((entry) => {
                const consistency = entry.consistency || 0
                const daysCompleted = entry.daysCompleted || 0
                const daysElapsed = entry.daysElapsed || 0
                
                return (
                  <div key={entry._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-2">{entry.habit?.name || 'Unknown Habit'}</h3>
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Consistency</p>
                            <span className={`text-base font-semibold ${
                              consistency >= 80 
                                ? 'text-green-600 dark:text-green-400' 
                                : consistency >= 50 
                                ? 'text-yellow-600 dark:text-yellow-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {consistency.toFixed(1)}%
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {daysCompleted}/{daysElapsed} days
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              entry.isDone 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}>
                              {entry.isDone ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-3 flex items-center">
                        <Checkbox
                          checked={entry.isDone}
                          onCheckedChange={() => handleToggleTracking(entry._id, entry.isDone)}
                          disabled={false}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>
              <div className="flex-1">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-semibold">
                    Delete Habit?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base mt-2">
                    Are you sure you want to delete this habit? This action cannot be undone and all associated tracking data will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 sm:mt-6">
                  <AlertDialogCancel 
                    onClick={() => setHabitToDelete(null)}
                    className="sm:mt-0"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteConfirm}
                    className="bg-destructive hover:bg-destructive/90 focus:ring-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </Sidebar>
    </>
  )
}

export default index
