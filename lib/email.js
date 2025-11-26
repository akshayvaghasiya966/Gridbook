import nodemailer from 'nodemailer'

// Create transporter with lazy initialization
let transporter = null

// Initialize transporter lazily at runtime
const getTransporter = () => {
  // Check if already initialized
  if (transporter) {
    return transporter
  }

  // Check if environment variables are available
  if (!process.env.NODEMAILER_AUTH_USERNAME || !process.env.NODEMAILER_AUTH_PASSWORD) {
    return null
  }

  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_AUTH_USERNAME,
        pass: process.env.NODEMAILER_AUTH_PASSWORD.replace(/\s/g, ''), // Remove spaces from app password
      },
    })
    return transporter
  } catch (error) {
    console.error('Error creating email transporter:', error)
    return null
  }
}

export const sendOTPEmail = async (email, otp) => {
  try {
    // Get transporter (lazy initialization)
    const transporter = getTransporter()
    
    // Check if transporter is configured
    if (!transporter) {
      console.error('Email transporter not configured. Please check NODEMAILER_AUTH_USERNAME and NODEMAILER_AUTH_PASSWORD in .env.local')
      return { 
        success: false, 
        error: 'Email service not configured. Please set NODEMAILER_AUTH_USERNAME and NODEMAILER_AUTH_PASSWORD in .env.local file and restart the server.' 
      }
    }

    // Verify transporter connection
    await transporter.verify()

    const mailOptions = {
      from: process.env.NODEMAILER_AUTH_USERNAME,
      to: email,
      subject: 'Your OTP for Gridbook Login',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Gridbook</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Your OTP Code</h2>
            <p style="color: #4b5563; font-size: 16px;">Use the following OTP to complete your login:</p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otp}</h1>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">This OTP will expire in 10 minutes. Do not share this code with anyone.</p>
          </div>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('OTP email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send OTP email'
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Gmail authentication failed. Please check your Gmail App Password.'
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to Gmail. Please check your internet connection.'
    } else if (error.response) {
      errorMessage = `Gmail error: ${error.response}`
    } else {
      errorMessage = error.message || 'Failed to send OTP email'
    }
    
    return { success: false, error: errorMessage }
  }
}

// Export getter function for transporter
export const getEmailTransporter = getTransporter
export default getTransporter

