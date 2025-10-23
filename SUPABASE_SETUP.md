# 🗄️ Supabase Database Setup Guide

## Step 1: Create Supabase Account
1. Go to: https://supabase.com
2. Click "Start your project" 
3. Sign up with GitHub (recommended) or email

## Step 2: Create New Project
1. Click "New project"
2. Choose your organization
3. Project details:
   - **Name**: "RouteWise AI"
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. ⏳ Wait 2-3 minutes for setup

## Step 3: Get Connection Details
1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **Project API Key** (anon public key)

## Step 4: Update Environment
Replace these lines in `.env.local`:
```
SUPABASE_URL=https://demo.supabase.co
SUPABASE_ANON_KEY=demo-key
```

With your real values:
```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key_here
```

## Step 5: Create Database Tables
The app will automatically create these tables when first run:
- `rides` - Ride information and status
- `user_preferences` - User settings and privacy preferences
- `safety_events` - Emergency situations and responses

## What Supabase Provides:
- ✅ Real-time PostgreSQL database
- ✅ Row Level Security (RLS) for privacy
- ✅ Automatic API generation
- ✅ Free tier: 50MB database, 50,000 monthly API requests

## Cost:
- **Free tier**: Suitable for development and testing
- **Pro ($25/month)**: 8GB database, 5M API requests