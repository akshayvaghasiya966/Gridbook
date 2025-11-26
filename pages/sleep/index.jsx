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
import { Trash2, Plus, Edit2, Moon, TrendingUp, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
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
import Sidebar from '@/components/Sidebar'
import { useToast } from '@/hooks/use-toast'
import { getToken, getUser, getAuthHeaders } from '@/lib/auth'

const ITEMS_PER_PAGE = 10

const Index = () => {
  const { toast } = useToast()
  const [sleepEntries, setSleepEntries] = useState([])
  const [weeklyStats, setWeeklyStats] = useState({ average: 0, totalHours: 0, days: 0, status: 'red' })
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sleepToDelete, setSleepToDelete] = useState(null)
  const [editingSleep, setEditingSleep] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sleepTime: '',
    wakeTime: '',
    duration: '',
    quality: 'good',
    notes: ''
  })

  // Check authentication on mount
  useEffect(() => {
    const token = getToken()
    const userData = getUser()
    
    if (token && userData) {
      fetchSleepEntries()
    } else {
      setLoading(false)
    }
  }, [])

  // Calculate duration from sleep time and wake time
  const calculateDuration = (sleepTime, wakeTime) => {
    if (!sleepTime || !wakeTime) return 0
    
    const [sleepHour, sleepMin] = sleepTime.split(':').map(Number)
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number)
    
    let sleepMinutes = sleepHour * 60 + sleepMin
    let wakeMinutes = wakeHour * 60 + wakeMin
    
    // Handle overnight sleep (wake time is next day)
    if (wakeMinutes < sleepMinutes) {
      wakeMinutes += 24 * 60 // Add 24 hours
    }
    
    const durationMinutes = wakeMinutes - sleepMinutes
    const durationHours = durationMinutes / 60
    
    return Math.round(durationHours * 100) / 100 // Round to 2 decimal places
  }

  // Fetch sleep entries from MongoDB
  const fetchSleepEntries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sleep', {
        headers: getAuthHeaders(),
      })
      
      if (response.status === 401) {
        setLoading(false)
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setSleepEntries(data.entries || [])
        setWeeklyStats(data.weeklyStats || { average: 0, totalHours: 0, days: 0, status: 'red' })
      }
    } catch (error) {
      console.error('Error fetching sleep entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const newFormData = {
      ...formData,
      [name]: value
    }
    
    // Auto-calculate duration when sleep time or wake time changes
    if (name === 'sleepTime' || name === 'wakeTime') {
      const duration = calculateDuration(
        name === 'sleepTime' ? value : formData.sleepTime,
        name === 'wakeTime' ? value : formData.wakeTime
      )
      newFormData.duration = duration > 0 ? duration.toFixed(2) : ''
    }
    
    setFormData(newFormData)
  }

  const handleSelectChange = (value) => {
    setFormData(prev => ({
      ...prev,
      quality: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.date || !formData.sleepTime || !formData.wakeTime || !formData.duration) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields",
      })
      return
    }

    if (parseFloat(formData.duration) <= 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Duration must be greater than 0",
      })
      return
    }

    try {
      if (editingSleep) {
        // Update existing sleep entry
        const response = await fetch(`/api/sleep/${editingSleep._id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          const data = await response.json()
          await fetchSleepEntries()
          setWeeklyStats(data.weeklyStats)
          resetForm()
          toast({
            variant: "success",
            title: "Success",
            description: "Sleep entry updated successfully",
          })
        } else {
          const error = await response.json()
          toast({
            variant: "destructive",
            title: "Error",
            description: error.error || 'Failed to update sleep entry',
          })
        }
      } else {
        // Create new sleep entry
        const response = await fetch('/api/sleep', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          const data = await response.json()
          await fetchSleepEntries()
          setWeeklyStats(data.weeklyStats)
          setCurrentPage(1)
          resetForm()
          toast({
            variant: "success",
            title: "Success",
            description: "Sleep entry added successfully",
          })
        } else {
          const error = await response.json()
          toast({
            variant: "destructive",
            title: "Error",
            description: error.error || 'Failed to add sleep entry',
          })
        }
      }
    } catch (error) {
      console.error('Error saving sleep entry:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to save sleep entry',
      })
    }
  }

  const handleEdit = (sleep) => {
    const date = new Date(sleep.date)
    const duration = calculateDuration(sleep.sleepTime, sleep.wakeTime)
    setEditingSleep(sleep)
    setFormData({
      date: date.toISOString().split('T')[0],
      sleepTime: sleep.sleepTime,
      wakeTime: sleep.wakeTime,
      duration: duration > 0 ? duration.toFixed(2) : sleep.duration.toFixed(2),
      quality: sleep.quality,
      notes: sleep.notes || ''
    })
    setDialogOpen(true)
  }

  const handleDeleteClick = (id) => {
    setSleepToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!sleepToDelete) return

    try {
      const response = await fetch(`/api/sleep/${sleepToDelete}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        await fetchSleepEntries()
        setWeeklyStats(data.weeklyStats)
        setDeleteDialogOpen(false)
        setSleepToDelete(null)
        toast({
          variant: "success",
          title: "Success",
          description: "Sleep entry deleted successfully",
        })
      }
    } catch (error) {
      console.error('Error deleting sleep entry:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to delete sleep entry',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      sleepTime: '',
      wakeTime: '',
      duration: '',
      quality: 'good',
      notes: ''
    })
    setEditingSleep(null)
    setDialogOpen(false)
  }

  // Pagination calculations
  const totalPages = Math.ceil(sleepEntries.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedEntries = sleepEntries.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getQualityColor = (quality) => {
    const colors = {
      excellent: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      good: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      fair: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      poor: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    }
    return colors[quality] || colors.good
  }

  return (
    <Sidebar>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Sleep</h1>
            <p className="text-muted-foreground">
              Monitor your sleep patterns and quality.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Sleep Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingSleep ? 'Edit Sleep Entry' : 'Add New Sleep Entry'}
                </DialogTitle>
                <DialogDescription>
                  Record your sleep time, wake time, and quality to track your sleep patterns.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="date" className="text-sm font-medium">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="quality" className="text-sm font-medium">
                        Quality
                      </label>
                      <Select value={formData.quality} onValueChange={handleSelectChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="sleepTime" className="text-sm font-medium">
                        Sleep Time <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="sleepTime"
                        name="sleepTime"
                        type="time"
                        value={formData.sleepTime}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="wakeTime" className="text-sm font-medium">
                        Wake Time <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="wakeTime"
                        name="wakeTime"
                        type="time"
                        value={formData.wakeTime}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="duration" className="text-sm font-medium">
                      Duration (hours) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      step="0.1"
                      min="0"
                      max="24"
                      value={formData.duration}
                      disabled
                      className="bg-muted cursor-not-allowed"
                      placeholder="Auto-calculated"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Automatically calculated from sleep and wake times
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium">
                      Notes
                    </label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Any additional notes about your sleep..."
                      className="min-h-[80px]"
                      maxLength={500}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSleep ? 'Update' : 'Add'} Entry
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Weekly Stats Card */}
        <div className="mb-6 p-6 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Weekly Sleep Average</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{weeklyStats.average.toFixed(1)}</span>
                <span className="text-muted-foreground">hours</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Based on {weeklyStats.days} day{weeklyStats.days !== 1 ? 's' : ''} of data
              </p>
            </div>
            <div className="flex items-center gap-3">
              {weeklyStats.status === 'green' ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-green-700 dark:text-green-300">Good</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="font-semibold text-red-700 dark:text-red-300">Low</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {weeklyStats.status === 'green' 
                ? '✓ Your weekly average is 8 hours or more. Great job!' 
                : '⚠ Your weekly average is below 8 hours. Try to get more sleep.'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading sleep entries...</p>
            </div>
          </div>
        ) : sleepEntries.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-card">
            <Moon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sleep entries recorded yet</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking your sleep to monitor your patterns.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Sleep Entry
            </Button>
          </div>
        ) : (
          <>
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Sleep Time</TableHead>
                    <TableHead>Wake Time</TableHead>
                    <TableHead className="text-center">Duration</TableHead>
                    <TableHead className="text-center">Quality</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEntries.map((entry) => (
                    <TableRow key={entry._id}>
                      <TableCell className="font-medium">
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell>{entry.sleepTime}</TableCell>
                      <TableCell>{entry.wakeTime}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${
                          entry.duration >= 8 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {entry.duration.toFixed(1)}h
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(entry.quality)}`}>
                          {entry.quality.charAt(0).toUpperCase() + entry.quality.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="line-clamp-1 text-muted-foreground text-sm">
                            {entry.notes || '-'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(entry)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteClick(entry._id)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
                              className="cursor-pointer"
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
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>
              <div className="flex-1">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-semibold">
                    Delete Sleep Entry?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base mt-2">
                    Are you sure you want to delete this sleep entry? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 sm:mt-6">
                  <AlertDialogCancel 
                    onClick={() => setSleepToDelete(null)}
                    className="sm:mt-0"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteConfirm}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
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
  )
}

export default Index
