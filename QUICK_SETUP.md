# Quick Setup Guide

## Step 1: Create .env.local file

Create a file named `.env.local` in the root directory with:

```env
MONGODB_URI=mongodb://localhost:27017/gridbook
JWT_SECRET=your-random-secret-key-here-minimum-32-characters
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-digit-app-password
```

## Step 2: Get Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and "Other (Custom name)"
5. Enter "Gridbook" as the name
6. Click "Generate"
7. Copy the 16-character password (remove spaces when adding to .env.local)

## Step 3: Generate JWT Secret

Run this command to generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Or use any random 32+ character string.

## Step 4: Restart Dev Server

After creating `.env.local`, restart your Next.js dev server:
```bash
npm run dev
```

## Troubleshooting

### "Failed to send OTP email"
- Check if `.env.local` file exists in root directory
- Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set correctly
- Make sure you're using App Password, not regular Gmail password
- Check server console for detailed error messages

### "Email service not configured"
- Make sure `.env.local` file exists
- Restart the dev server after creating/updating `.env.local`

