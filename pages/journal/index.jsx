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
import { Trash2, Plus, Edit2, BookOpen, AlertTriangle } from 'lucide-react'
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import Sidebar from '@/components/Sidebar'
import { useToast } from '@/hooks/use-toast'
import { getToken, getUser, getAuthHeaders } from '@/lib/auth'

const ITEMS_PER_PAGE = 10

const moodOptions = [
  { value: 'happy', label: '😊 Happy', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
  { value: 'sad', label: '😢 Sad', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
  { value: 'anxious', label: '😰 Anxious', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
  { value: 'excited', label: '🎉 Excited', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400' },
  { value: 'calm', label: '😌 Calm', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
  { value: 'angry', label: '😠 Angry', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
  { value: 'grateful', label: '🙏 Grateful', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
  { value: 'neutral', label: '😐 Neutral', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
]

const Index = () => {
  const { toast } = useToast()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState(null)
  const [editingEntry, setEditingEntry] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
    mood: 'neutral',
    tags: ''
  })

  // Check authentication on mount
  useEffect(() => {
    const token = getToken()
    const userData = getUser()
    
    if (token && userData) {
      fetchEntries()
    } else {
      setLoading(false)
    }
  }, [])

  // Fetch journal entries from MongoDB
  const fetchEntries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/journal', {
        headers: getAuthHeaders(),
      })
      
      if (response.status === 401) {
        setLoading(false)
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error)
    } finally {
      setLoading(false)
    }
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
      mood: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.date || !formData.title || !formData.content) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields",
      })
      return
    }

    try {
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : []

      if (editingEntry) {
        // Update existing entry
        const response = await fetch(`/api/journal/${editingEntry._id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...formData,
            tags: tagsArray
          }),
        })

        if (response.ok) {
          await fetchEntries()
          resetForm()
          toast({
            variant: "success",
            title: "Success",
            description: "Journal entry updated successfully",
          })
        } else {
          const error = await response.json()
          toast({
            variant: "destructive",
            title: "Error",
            description: error.error || 'Failed to update journal entry',
          })
        }
      } else {
        // Create new entry
        const response = await fetch('/api/journal', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...formData,
            tags: tagsArray
          }),
        })

        if (response.ok) {
          await fetchEntries()
          setCurrentPage(1)
          resetForm()
          toast({
            variant: "success",
            title: "Success",
            description: "Journal entry created successfully",
          })
        } else {
          const error = await response.json()
          toast({
            variant: "destructive",
            title: "Error",
            description: error.error || 'Failed to create journal entry',
          })
        }
      }
    } catch (error) {
      console.error('Error saving journal entry:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to save journal entry',
      })
    }
  }

  const handleEdit = (entry) => {
    const date = new Date(entry.date)
    setEditingEntry(entry)
    setFormData({
      date: date.toISOString().split('T')[0],
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      tags: entry.tags ? entry.tags.join(', ') : ''
    })
    setDialogOpen(true)
  }

  const handleDeleteClick = (id) => {
    setEntryToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return

    try {
      const response = await fetch(`/api/journal/${entryToDelete}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        await fetchEntries()
        setDeleteDialogOpen(false)
        setEntryToDelete(null)
        toast({
          variant: "success",
          title: "Success",
          description: "Journal entry deleted successfully",
        })
      }
    } catch (error) {
      console.error('Error deleting journal entry:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to delete journal entry',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      title: '',
      content: '',
      mood: 'neutral',
      tags: ''
    })
    setEditingEntry(null)
    setDialogOpen(false)
  }

  // Pagination calculations
  const totalPages = Math.ceil(entries.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedEntries = entries.slice(startIndex, endIndex)

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

  const getMoodInfo = (mood) => {
    return moodOptions.find(m => m.value === mood) || moodOptions[moodOptions.length - 1]
  }

  return (
    <Sidebar>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Journal</h1>
            <p className="text-muted-foreground">
              Write and reflect on your daily thoughts and experiences.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
                </DialogTitle>
                <DialogDescription>
                  Capture your thoughts, experiences, and reflections.
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
                      <label htmlFor="mood" className="text-sm font-medium">
                        Mood
                      </label>
                      <Select value={formData.mood} onValueChange={handleSelectChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {moodOptions.map((mood) => (
                            <SelectItem key={mood.value} value={mood.value}>
                              {mood.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="What's on your mind?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="content" className="text-sm font-medium">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      placeholder="Write your thoughts here..."
                      className="min-h-[200px]"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.content.length}/10000 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="tags" className="text-sm font-medium">
                      Tags
                    </label>
                    <Input
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      placeholder="work, personal, goals (comma separated)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate tags with commas
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingEntry ? 'Update' : 'Create'} Entry
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading journal entries...</p>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-card">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No journal entries yet</h3>
            <p className="text-muted-foreground mb-4">
              Start writing to capture your thoughts and experiences.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Write Your First Entry
            </Button>
          </div>
        ) : (
          <>
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-[200px]">Preview</TableHead>
                    <TableHead className="w-[120px] text-center">Mood</TableHead>
                    <TableHead className="w-[150px]">Tags</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEntries.map((entry) => {
                    const moodInfo = getMoodInfo(entry.mood)
                    return (
                      <TableRow key={entry._id}>
                        <TableCell className="font-medium">
                          {formatDate(entry.date)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {entry.title}
                        </TableCell>
                        <TableCell>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {entry.content}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${moodInfo.color}`}>
                            {moodInfo.label.split(' ')[0]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {entry.tags && entry.tags.length > 0 ? (
                              entry.tags.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md text-xs bg-muted text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                            {entry.tags && entry.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{entry.tags.length - 3}</span>
                            )}
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
                    )
                  })}
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
                    Delete Journal Entry?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base mt-2">
                    Are you sure you want to delete this journal entry? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 sm:mt-6">
                  <AlertDialogCancel 
                    onClick={() => setEntryToDelete(null)}
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
