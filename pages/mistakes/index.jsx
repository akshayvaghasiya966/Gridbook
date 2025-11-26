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
import { Trash2, Plus, Edit2, AlertCircle, AlertTriangle } from 'lucide-react'
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
  const [mistakes, setMistakes] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [mistakeToDelete, setMistakeToDelete] = useState(null)
  const [editingMistake, setEditingMistake] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState({
    mistake: '',
    reason: '',
    solution: ''
  })

  // Check authentication on mount
  useEffect(() => {
    const token = getToken()
    const userData = getUser()
    
    if (token && userData) {
      fetchMistakes()
    } else {
      setLoading(false)
    }
  }, [])

  // Fetch mistakes from MongoDB
  const fetchMistakes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/mistakes', {
        headers: getAuthHeaders(),
      })
      
      if (response.status === 401) {
        setLoading(false)
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setMistakes(data)
      }
    } catch (error) {
      console.error('Error fetching mistakes:', error)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.mistake || !formData.reason || !formData.solution) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all fields",
      })
      return
    }

    try {
      if (editingMistake) {
        // Update existing mistake
        const response = await fetch(`/api/mistakes/${editingMistake._id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          await fetchMistakes()
          resetForm()
        }
      } else {
        // Create new mistake
        const response = await fetch('/api/mistakes', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          await fetchMistakes()
          setCurrentPage(1)
          resetForm()
        }
      }
    } catch (error) {
      console.error('Error saving mistake:', error)
    }
  }

  const handleEdit = (mistake) => {
    setEditingMistake(mistake)
    setFormData({
      mistake: mistake.mistake,
      reason: mistake.reason,
      solution: mistake.solution
    })
    setDialogOpen(true)
  }

  const handleDeleteClick = (id) => {
    setMistakeToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!mistakeToDelete) return

    try {
      const response = await fetch(`/api/mistakes/${mistakeToDelete}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        await fetchMistakes()
        setDeleteDialogOpen(false)
        setMistakeToDelete(null)
      }
    } catch (error) {
      console.error('Error deleting mistake:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      mistake: '',
      reason: '',
      solution: ''
    })
    setEditingMistake(null)
    setDialogOpen(false)
  }

  // Pagination calculations
  const totalPages = Math.ceil(mistakes.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedMistakes = mistakes.slice(startIndex, endIndex)

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

  return (
    <Sidebar>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Mistakes</h1>
            <p className="text-muted-foreground">
              Track your mistakes, understand the reasons, and learn from solutions.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Mistake
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingMistake ? 'Edit Mistake' : 'Add New Mistake'}
                </DialogTitle>
                <DialogDescription>
                  Record a mistake, its reason, and the solution to learn from it.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="mistake" className="text-sm font-medium">
                      Mistake <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="mistake"
                      name="mistake"
                      value={formData.mistake}
                      onChange={handleChange}
                      placeholder="Describe the mistake..."
                      className="min-h-[100px]"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="reason" className="text-sm font-medium">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      placeholder="Why did this mistake happen?"
                      className="min-h-[100px]"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="solution" className="text-sm font-medium">
                      Solution <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="solution"
                      name="solution"
                      value={formData.solution}
                      onChange={handleChange}
                      placeholder="What is the solution or how to avoid this mistake?"
                      className="min-h-[100px]"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingMistake ? 'Update' : 'Add'} Mistake
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
              <p className="text-muted-foreground">Loading mistakes...</p>
            </div>
          </div>
        ) : mistakes.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-card">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No mistakes recorded yet</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking your mistakes to learn and grow.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Mistake
            </Button>
          </div>
        ) : (
          <>
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Mistake</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Solution</TableHead>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMistakes.map((mistake) => (
                    <TableRow key={mistake._id}>
                      <TableCell className="font-medium">
                        <div className="max-w-[200px]">
                          <p className="line-clamp-2">{mistake.mistake}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[300px]">
                          <p className="line-clamp-2 text-muted-foreground">{mistake.reason}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[300px]">
                          <p className="line-clamp-2 text-muted-foreground">{mistake.solution}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(mistake.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(mistake)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteClick(mistake._id)}
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
                    Delete Mistake?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base mt-2">
                    Are you sure you want to delete this mistake? This action cannot be undone and all associated data will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 sm:mt-6">
                  <AlertDialogCancel 
                    onClick={() => setMistakeToDelete(null)}
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
  )
}

export default Index
