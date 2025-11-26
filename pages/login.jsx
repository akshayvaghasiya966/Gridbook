import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Loader2, LayoutDashboard } from 'lucide-react'
import { setAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'

const Login = () => {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('email') // 'email' or 'otp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  // Check if already logged in
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      router.push('/')
    }
  }, [router])

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setOtpSent(true)
        setStep('otp')
        toast({
          variant: "success",
          title: "OTP Sent",
          description: `We've sent a 6-digit OTP to ${email}. Please check your inbox.`,
        })
      } else {
        setError(data.error || 'Failed to send OTP')
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || 'Failed to send OTP',
        })
      }
    } catch (error) {
      setError('Failed to send OTP. Please try again.')
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to send OTP. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store token in localStorage
        setAuth(data.token, data.user)
        
        toast({
          variant: "success",
          title: "Login Successful",
          description: "Welcome back! Redirecting...",
        })
        
        // Redirect to home page
        setTimeout(() => {
          router.push('/')
        }, 1000)
      } else {
        setError(data.error || 'Invalid OTP')
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || 'Invalid OTP',
        })
      }
    } catch (error) {
      setError('Failed to verify OTP. Please try again.')
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to verify OTP. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setStep('email')
    setOtp('')
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <LayoutDashboard className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Gridbook</h1>
          <p className="text-muted-foreground">
            {step === 'email' 
              ? 'Sign in to access your dashboard' 
              : 'Enter the OTP sent to your email'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-4 bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="pl-10 h-11"
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium">
                  Enter 6-Digit OTP
                </label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest font-mono h-14"
                  maxLength={6}
                  required
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-center">
                  OTP sent to <span className="font-medium">{email}</span>
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  Didn't receive OTP?{' '}
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="text-primary hover:underline font-medium"
                    disabled={loading}
                  >
                    Resend
                  </button>
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-11"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-11" 
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}

export default Login

