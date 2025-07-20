# ParkEasy Setup Guide

This guide will help you set up the ParkEasy application and resolve signup issues.

## Prerequisites

1. Node.js (v16 or higher)
2. A Supabase account and project

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

1. Create a new project on [Supabase](https://supabase.com)
2. In your Supabase project dashboard, go to Settings > API
3. Copy your Project URL and anon public key

### 3. Configure Environment Variables

1. Copy the `.env` file and update it with your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key_here
```

### 4. Setup Database Schema

Run the complete database setup script in your Supabase SQL editor:

1. Copy the contents of `setup-database.sql`
2. Paste it into your Supabase SQL editor
3. Click "Run" to execute the script

This will create all necessary tables, policies, and indexes for the ParkEasy application.

### 5. Test Configuration

```bash
npm run test:env
```

This will verify that your environment variables are set correctly.

### 6. Start Development Server

```bash
npm run dev
```

## Common Signup Issues & Solutions

### Issue 1: "Missing Supabase environment variables"
**Solution**: Make sure your `.env` file exists and contains valid Supabase credentials.

### Issue 2: "User already registered"
**Solution**: The email is already taken. Try signing in instead or use a different email.

### Issue 3: "Phone number is already taken"
**Solution**: Each phone number must be unique. Use a different phone number.

### Issue 4: "Failed to create account" or database errors
**Solution**: 
1. Verify all database migrations have been run
2. Check that RLS (Row Level Security) is properly configured
3. Ensure your Supabase project has the correct permissions

### Issue 5: Signup succeeds but can't access dashboard
**Solution**: This usually means the user profile wasn't created properly. Check the browser console for errors.

## Database Schema Overview

- `auth.users` - Managed by Supabase (email, password)
- `user_profiles` - Custom user data (name, phone, address, payment info)
- `parking_spaces` - Parking space listings
- `bookings` - Booking records
- `payments` - Payment transactions

## Features

- **Customer signup**: Find and book parking spaces
- **Owner signup**: List parking spaces and manage bookings
- **Secure authentication** with Supabase
- **Payment processing** integration ready
- **Mobile-responsive** design

## Troubleshooting

1. **Check browser console** for detailed error messages
2. **Verify Supabase project status** in the dashboard
3. **Test database connection** using the Supabase SQL editor
4. **Check network connectivity** if requests are failing

For additional help, check the Supabase documentation or contact support.