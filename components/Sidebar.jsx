import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { 
  LayoutDashboard, 
  Wallet, 
  Target, 
  Moon, 
  BookOpen, 
  AlertCircle,
  Menu,
  X,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { clearAuth } from '@/lib/auth'

const navigationItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/finance', label: 'Finance', icon: Wallet },
  { path: '/habits', label: 'Habits', icon: Target },
  { path: '/sleep', label: 'Sleep', icon: Moon },
  { path: '/journal', label: 'Journal', icon: BookOpen },
  { path: '/mistakes', label: 'Mistakes', icon: AlertCircle },
]

const Sidebar = ({ children }) => {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768)
        if (window.innerWidth >= 768) {
          setIsMobileMenuOpen(false)
        }
      }
    }

    checkMobile()
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [])

  const handleNavigation = (path) => {
    router.push(path)
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  }

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  const NavItem = ({ item, isActive }) => {
    const Icon = item.icon
    return (
      <button
        onClick={() => handleNavigation(item.path)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
            : 'text-sidebar-foreground'
        )}
      >
        <Icon className="w-5 h-5" />
        <span>{item.label}</span>
      </button>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:border-r md:border-sidebar-border bg-sidebar">
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2 px-6 py-6 border-b border-sidebar-border">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">Gridbook</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = router.pathname === item.path
              return (
                <NavItem key={item.path} item={item} isActive={isActive} />
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="px-4 py-4 border-t border-sidebar-border">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-background/80 backdrop-blur-sm"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border md:hidden transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="flex items-center justify-between px-6 py-6 border-b border-sidebar-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5 text-sidebar-primary-foreground" />
                  </div>
                  <span className="text-lg font-semibold text-sidebar-foreground">Gridbook</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navigationItems.map((item) => {
                  const isActive = router.pathname === item.path
                  return (
                    <NavItem key={item.path} item={item} isActive={isActive} />
                  )
                })}
              </nav>

              {/* Mobile Logout Button */}
              <div className="px-4 py-4 border-t border-sidebar-border">
                <Button
                  onClick={() => {
                    handleLogout()
                    setIsMobileMenuOpen(false)
                  }}
                  variant="outline"
                  className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-20 md:pt-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Sidebar

