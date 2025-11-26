# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

## Required Environment Variables

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/gridbook
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gridbook

# JWT Secret Key (Change this to a strong random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Gmail Configuration for OTP
# Use Gmail App Password, not your regular Gmail password
# To generate App Password:
# 1. Go to Google Account settings
# 2. Security > 2-Step Verification > App passwords
# 3. Generate a new app password for "Mail"
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-digit-app-password
```

## Setup Instructions

### 1. MongoDB
- **Local MongoDB**: Use `mongodb://localhost:27017/gridbook`
- **MongoDB Atlas**: Get connection string from MongoDB Atlas dashboard

### 2. JWT Secret
- Generate a strong random string (at least 32 characters)
- You can use: `openssl rand -base64 32` or any random string generator
- **Important**: Never commit this to git!

### 3. Gmail Configuration

#### Step 1: Enable 2-Step Verification
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already enabled

#### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" as the app
3. Select "Other (Custom name)" as device
4. Enter "Gridbook" as the name
5. Click "Generate"
6. Copy the 16-character password (spaces will be removed automatically)

#### Step 3: Add to .env.local
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

**Note**: Remove spaces from the app password when adding to .env.local

## Example .env.local file

```env
MONGODB_URI=mongodb://localhost:27017/gridbook
JWT_SECRET=my-super-secret-jwt-key-12345678901234567890
GMAIL_USER=myemail@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

## Security Notes

- Never commit `.env.local` to git (it's already in .gitignore)
- Use strong, unique values for JWT_SECRET in production
- Keep your Gmail App Password secure
- Rotate secrets regularly in production

