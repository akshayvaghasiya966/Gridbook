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
import { Input } from '@/components/ui/input'
import { Trash2, Plus, Edit2, Calculator, AlertTriangle, X } from 'lucide-react'
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

// Helper function to extract variables from formula
const extractVariables = (formula) => {
  if (!formula) return []
  const matches = formula.match(/\b[a-z]\b/gi)
  if (!matches) return []
  return [...new Set(matches)].sort()
}

// Helper function to evaluate formula safely
const evaluateFormula = (formula, variables) => {
  try {
    if (!formula || !variables) {
      return { success: false, result: null, error: 'Formula or variables missing' }
    }

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
      return { success: false, result: null, error: 'Invalid characters in formula' }
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

const Index = () => {
  const { toast } = useToast()
  const [formulas, setFormulas] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [formulaToDelete, setFormulaToDelete] = useState(null)
  const [editingFormula, setEditingFormula] = useState(null)
  const [executingFormula, setExecutingFormula] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    formula: '',
    variables: {}
  })
  const [executeVariables, setExecuteVariables] = useState({})
  const [calculatedResult, setCalculatedResult] = useState(null)
  const [calculationError, setCalculationError] = useState(null)

  // Check authentication on mount
  useEffect(() => {
    const token = getToken()
    const userData = getUser()
    
    if (token && userData) {
      fetchFormulas()
    } else {
      setLoading(false)
    }
  }, [])

  // Update variables when formula changes
  useEffect(() => {
    if (formData.formula) {
      const vars = extractVariables(formData.formula)
      const newVariables = {}
      vars.forEach(v => {
        newVariables[v] = formData.variables[v] || ''
      })
      setFormData(prev => ({
        ...prev,
        variables: newVariables
      }))
    }
  }, [formData.formula])

  // Recalculate when execute variables change
  useEffect(() => {
    if (executingFormula && executingFormula.formula && Object.keys(executeVariables).length > 0) {
      const calculation = evaluateFormula(executingFormula.formula, executeVariables)
      setCalculatedResult(calculation.result)
      setCalculationError(calculation.error)
    }
  }, [executeVariables, executingFormula])

  // Fetch formulas from MongoDB
  const fetchFormulas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/formulas', {
        headers: getAuthHeaders(),
      })
      
      if (response.status === 401) {
        setLoading(false)
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setFormulas(data)
      }
    } catch (error) {
      console.error('Error fetching formulas:', error)
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

  const handleVariableChange = (varName, value) => {
    setFormData(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [varName]: value
      }
    }))
  }

  const handleExecuteVariableChange = (varName, value) => {
    const numValue = parseFloat(value) || 0
    setExecuteVariables(prev => ({
      ...prev,
      [varName]: numValue
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.formula) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in name and formula",
      })
      return
    }

    // Validate that all variables in formula have been defined
    const vars = extractVariables(formData.formula)
    const missingVars = vars.filter(v => !formData.variables.hasOwnProperty(v) || formData.variables[v] === '')
    
    if (missingVars.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: `Please define all variables: ${missingVars.join(', ')}`,
      })
      return
    }

    try {
      if (editingFormula) {
        // Update existing formula
        const response = await fetch(`/api/formulas/${editingFormula._id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          await fetchFormulas()
          resetForm()
          toast({
            variant: "success",
            title: "Success",
            description: "Formula updated successfully",
          })
        } else {
          const error = await response.json()
          toast({
            variant: "destructive",
            title: "Error",
            description: error.error || 'Failed to update formula',
          })
        }
      } else {
        // Create new formula
        const response = await fetch('/api/formulas', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          await fetchFormulas()
          resetForm()
          toast({
            variant: "success",
            title: "Success",
            description: "Formula added successfully",
          })
        } else {
          const error = await response.json()
          toast({
            variant: "destructive",
            title: "Error",
            description: error.error || 'Failed to add formula',
          })
        }
      }
    } catch (error) {
      console.error('Error saving formula:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to save formula',
      })
    }
  }

  const handleEdit = (formula) => {
    setEditingFormula(formula)
    const variablesObj = {}
    if (formula.variables) {
      if (formula.variables instanceof Map) {
        formula.variables.forEach((value, key) => {
          variablesObj[key] = value
        })
      } else {
        Object.keys(formula.variables).forEach(key => {
          variablesObj[key] = formula.variables[key]
        })
      }
    }
    setFormData({
      name: formula.name,
      formula: formula.formula,
      variables: variablesObj
    })
    setDialogOpen(true)
  }

  const handleExecute = (formula) => {
    setExecutingFormula(formula)
    const vars = extractVariables(formula.formula)
    const initialVars = {}
    vars.forEach(v => {
      initialVars[v] = 0
    })
    setExecuteVariables(initialVars)
    setCalculatedResult(null)
    setCalculationError(null)
    setExecuteDialogOpen(true)
  }

  const handleDeleteClick = (id) => {
    setFormulaToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!formulaToDelete) return

    try {
      const response = await fetch(`/api/formulas/${formulaToDelete}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        await fetchFormulas()
        setDeleteDialogOpen(false)
        setFormulaToDelete(null)
        toast({
          variant: "success",
          title: "Success",
          description: "Formula deleted successfully",
        })
      }
    } catch (error) {
      console.error('Error deleting formula:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to delete formula',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      formula: '',
      variables: {}
    })
    setEditingFormula(null)
    setDialogOpen(false)
  }

  const resetExecuteDialog = () => {
    setExecuteDialogOpen(false)
    setExecutingFormula(null)
    setExecuteVariables({})
    setCalculatedResult(null)
    setCalculationError(null)
  }

  const variables = extractVariables(formData.formula)
  const executeVars = executingFormula ? extractVariables(executingFormula.formula) : []

  return (
    <Sidebar>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Formulas</h1>
            <p className="text-muted-foreground">
              Create and manage mathematical formulas with variables.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Formula
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingFormula ? 'Edit Formula' : 'Add New Formula'}
                </DialogTitle>
                <DialogDescription>
                  Create a formula using variables (a, b, c, etc.) and mathematical operations.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Profit Calculation"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="formula" className="text-sm font-medium">
                      Formula <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="formula"
                      name="formula"
                      value={formData.formula}
                      onChange={handleChange}
                      placeholder="e.g., a*b-a-c"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Use variables (a, b, c, etc.) and operators (+, -, *, /, parentheses)
                    </p>
                  </div>

                  {variables.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Define Variables</label>
                      <p className="text-xs text-muted-foreground">
                        Enter variable names (these will be used when executing the formula)
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {variables.map(v => (
                          <div key={v} className="space-y-2">
                            <label htmlFor={`var-${v}`} className="text-sm font-medium">
                              {v.toUpperCase()} (Variable Name)
                            </label>
                            <Input
                              id={`var-${v}`}
                              type="text"
                              value={formData.variables[v] || ''}
                              onChange={(e) => handleVariableChange(v, e.target.value)}
                              placeholder={`e.g., ${v === 'a' ? 'Price' : v === 'b' ? 'Quantity' : 'Value'}`}
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingFormula ? 'Update' : 'Add'} Formula
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
              <p className="text-muted-foreground">Loading formulas...</p>
            </div>
          </div>
        ) : formulas.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-card">
            <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No formulas yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first formula to get started.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Formula
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formulas.map((formula) => {
              const variablesObj = formula.variables instanceof Map 
                ? Object.fromEntries(formula.variables) 
                : formula.variables || {}
              return (
                <div
                  key={formula._id}
                  className="border border-border rounded-lg bg-card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleExecute(formula)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      {formula.name}
                    </h3>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(formula)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(formula._id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Formula:</p>
                    <code className="px-3 py-2 rounded bg-muted text-sm font-mono block">
                      {formula.formula}
                    </code>
                  </div>
                  {Object.keys(variablesObj).length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Variables:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(variablesObj).map(key => (
                          <span
                            key={key}
                            className="px-2 py-1 rounded bg-muted text-xs font-medium"
                          >
                            {key} = {variablesObj[key]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calculator className="w-4 h-4" />
                    <span>Click to use this formula</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Execute Formula Dialog */}
        <Dialog open={executeDialogOpen} onOpenChange={setExecuteDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {executingFormula?.name || 'Execute Formula'}
              </DialogTitle>
              <DialogDescription>
                Enter values for the variables to calculate the result.
              </DialogDescription>
            </DialogHeader>
            {executingFormula && (
              <div className="space-y-4 py-4">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm font-medium mb-1">Formula:</p>
                  <code className="text-sm font-mono">{executingFormula.formula}</code>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Enter Values</label>
                  <div className="grid grid-cols-2 gap-3">
                    {executeVars.map(v => {
                      const variablesObj = executingFormula.variables instanceof Map 
                        ? Object.fromEntries(executingFormula.variables) 
                        : executingFormula.variables || {}
                      const varLabel = variablesObj[v] || v.toUpperCase()
                      return (
                        <div key={v} className="space-y-2">
                          <label htmlFor={`exec-${v}`} className="text-sm font-medium">
                            {varLabel} ({v})
                          </label>
                          <Input
                            id={`exec-${v}`}
                            type="number"
                            step="0.01"
                            value={executeVariables[v] || 0}
                            onChange={(e) => handleExecuteVariableChange(v, e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {calculatedResult !== null && !calculationError && (
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                          Result:
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {calculatedResult}
                      </span>
                    </div>
                  </div>
                )}

                {calculationError && (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                        Error: {calculationError}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetExecuteDialog}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                    Delete Formula?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base mt-2">
                    Are you sure you want to delete this formula? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 sm:mt-6">
                  <AlertDialogCancel 
                    onClick={() => setFormulaToDelete(null)}
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
