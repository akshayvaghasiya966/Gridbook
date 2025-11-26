import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Mail, Loader2 } from 'lucide-react'

const LoginDialog = ({ open, onOpenChange, onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('email') // 'email' or 'otp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpSent, setOtpSent] = useState(false)

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
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      setError('Failed to send OTP. Please try again.')
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
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Call success callback
        if (onLoginSuccess) {
          onLoginSuccess(data.token, data.user)
        }
        
        // Reset form
        setEmail('')
        setOtp('')
        setStep('email')
        setOtpSent(false)
        onOpenChange(false)
      } else {
        setError(data.error || 'Invalid OTP')
      }
    } catch (error) {
      setError('Failed to verify OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setOtp('')
    setStep('email')
    setError('')
    setOtpSent(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{step === 'email' ? 'Sign In / Sign Up' : 'Enter OTP'}</DialogTitle>
          <DialogDescription>
            {step === 'email'
              ? 'Enter your email address to receive an OTP'
              : `We've sent a 6-digit OTP to ${email}. Please check your inbox.`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOTP}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="space-y-4 py-4">
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
                  className="text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                  required
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Didn't receive OTP?{' '}
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="text-primary hover:underline"
                    disabled={loading}
                  >
                    Resend
                  </button>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep('email')} disabled={loading}>
                Back
              </Button>
              <Button type="submit" disabled={loading || otp.length !== 6}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default LoginDialog

