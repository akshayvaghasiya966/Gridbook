import mongoose from 'mongoose'
import User from '@/models/User'
import connectDB from '@/lib/mongodb'
import { sendOTPEmail } from '@/lib/email'
import { generateToken } from '@/lib/jwt'

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP for signup/signin
export const sendOTP = async (req, res) => {
  try {
    await connectDB()
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    const otp = generateOTP()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() })

    if (user) {
      // Update existing user's OTP
      user.otp = otp
      user.otpExpires = otpExpires
      await user.save()
    } else {
      // Create new user
      user = new User({
        email: email.toLowerCase(),
        otp,
        otpExpires,
      })
      await user.save()
    }

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp)

    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error)
      return res.status(500).json({ 
        error: emailResult.error || 'Failed to send OTP email. Please check your email configuration.' 
      })
    }

    return res.status(200).json({
      message: 'OTP sent successfully',
      email: email,
    })
  } catch (error) {
    console.error('Error sending OTP:', error)
    return res.status(500).json({ error: 'Failed to send OTP' })
  }
}

// Verify OTP and sign in/sign up
export const verifyOTP = async (req, res) => {
  try {
    await connectDB()
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please request OTP first.' })
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' })
    }

    // Check if OTP has expired
    if (user.otpExpires < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' })
    }

    // Clear OTP
    user.otp = null
    user.otpExpires = null
    user.isVerified = true
    user.lastLogin = new Date()
    await user.save()

    // Generate JWT token
    const token = generateToken(user._id)

    return res.status(200).json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return res.status(500).json({ error: 'Failed to verify OTP' })
  }
}

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    await connectDB()
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await User.findById(userId).select('-otp -otpExpires')

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
      },
    })
  } catch (error) {
    console.error('Error getting current user:', error)
    return res.status(500).json({ error: 'Failed to get user' })
  }
}

