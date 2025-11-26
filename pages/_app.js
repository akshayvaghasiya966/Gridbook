import "@/styles/globals.css";
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Toaster } from '@/components/ui/toaster'
import { getToken, getUser, clearAuth, setAuth } from '@/lib/auth'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Function to check authentication
  const checkAuth = async () => {
    const token = getToken()
    const userData = getUser()

    if (!token || !userData) {
      setIsAuthenticated(false)
      setLoading(false)
      // Redirect to login page if not already there
      if (router.pathname !== '/login') {
        router.push('/login')
      }
      return false
    }

    // Verify token with server
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setIsAuthenticated(true)
        // Update user data if needed
        if (data.user) {
          setAuth(token, data.user)
        }
        setLoading(false)
        return true
      } else {
        // Token is invalid
        clearAuth()
        setIsAuthenticated(false)
        setLoading(false)
        // Redirect to login page if not already there
        if (router.pathname !== '/login') {
          router.push('/login')
        }
        return false
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      clearAuth()
      setIsAuthenticated(false)
      setLoading(false)
      // Redirect to login page if not already there
      if (router.pathname !== '/login') {
        router.push('/login')
      }
      return false
    }
  }

  // Check authentication on mount and route changes
  useEffect(() => {
    // Don't check auth on login page
    if (router.pathname === '/login') {
      setLoading(false)
      return
    }

    checkAuth()

    const handleRouteChange = (url) => {
      // Don't check auth on login page
      if (url === '/login') {
        setLoading(false)
        return
      }
      checkAuth()
    }

    router.events.on('routeChangeStart', handleRouteChange)
    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname])

  // Show loading state while checking auth (but not on login page)
  if (loading && router.pathname !== '/login') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Component {...pageProps} />
      <Toaster />
    </>
  )
}
