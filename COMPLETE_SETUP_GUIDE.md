# Complete Setup Guide for RouteWise AI

This guide provides step-by-step instructions to set up all real credentials and services for the RouteWise AI system.

## Overview

RouteWise AI requires several services:
- **Auth0**: Authentication and user management
- **Supabase**: Database for user data and ride information
- **OpenAI**: AI agent responses
- **Google Maps**: Location and routing services
- **Spotify**: Music preferences integration
- **OpenWeatherMap**: Weather data for ride insights

## 1. Auth0 Setup (Authentication & Authorization)

### Step 1: Create Auth0 Account
1. Go to [auth0.com](https://auth0.com) and click "Sign up"
2. Create a free account
3. Complete email verification

### Step 2: Create Auth0 Application
1. In Auth0 dashboard, go to **Applications** > **Create Application**
2. Choose **Regular Web Applications**
3. Select **Next.js** as technology
4. Click **Create**

### Step 3: Configure Application Settings
1. Go to **Settings** tab of your application
2. Add these **Allowed Callback URLs**:
   ```
   http://localhost:3000/api/auth/callback
   ```
3. Add these **Allowed Logout URLs**:
   ```
   http://localhost:3000
   ```
4. Add these **Allowed Web Origins**:
   ```
   http://localhost:3000
   ```
5. Click **Save Changes**

### Step 4: Create Machine-to-Machine Application
1. Go to **Applications** > **Create Application**
2. Name it "RouteWise AI Backend"
3. Choose **Machine to Machine Applications**
4. Select your **Management API**
5. Grant these scopes:
   - `read:users`
   - `update:users`
   - `read:user_metadata`
   - `update:user_metadata`

### Step 5: Configure User Permissions
1. Go to **User Management** > **Actions**
2. Click **Build Custom** > **Login**
3. Create action named "Add User Permissions"
4. Add this code:
   ```javascript
   exports.onExecutePostLogin = async (event, api) => {
     const { user } = event;
     
     // Add default permissions for new users
     if (!user.app_metadata) {
       api.user.setAppMetadata('permissions', {
         location: false,
         music: false,
         calendar: false
       });
     }
   };
   ```
5. **Deploy** the action
6. Go to **Actions** > **Flows** > **Login**
7. Drag your action into the flow and click **Apply**

### Step 6: Get Auth0 Credentials
From your application **Settings**, copy these values:
- **Domain** (e.g., `dev-xyz.us.auth0.com`)
- **Client ID**
- **Client Secret**

From your **Machine-to-Machine** application:
- **Client ID** (M2M)
- **Client Secret** (M2M)

## 2. Supabase Database Setup

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up
2. Click **New Project**
3. Choose organization and region
4. Set database password (save this!)
5. Wait for project to initialize

### Step 2: Create Database Schema
1. Go to **SQL Editor** in Supabase dashboard
2. Run this SQL to create the schema:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create passengers table
CREATE TABLE passengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth0_user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create drivers table
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth0_user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  vehicle_info JSONB DEFAULT '{}',
  rating DECIMAL(2,1) DEFAULT 5.0,
  is_available BOOLEAN DEFAULT true,
  current_location POINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rides table
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id UUID REFERENCES passengers(id),
  driver_id UUID REFERENCES drivers(id),
  pickup_location JSONB NOT NULL,
  destination JSONB NOT NULL,
  status TEXT DEFAULT 'requested',
  fare DECIMAL(10,2),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_passengers_auth0_user_id ON passengers(auth0_user_id);
CREATE INDEX idx_drivers_auth0_user_id ON drivers(auth0_user_id);
CREATE INDEX idx_rides_passenger_id ON rides(passenger_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Insert sample data
INSERT INTO passengers (auth0_user_id, name, email, phone, preferences) VALUES
('auth0|sample123', 'John Doe', 'john@example.com', '+1234567890', '{"music": {"spotify_access": true, "preferred_genres": ["pop", "rock"]}, "location": {"share_precise": true}}');

INSERT INTO drivers (auth0_user_id, name, email, phone, vehicle_info) VALUES
('auth0|driver456', 'Jane Smith', 'jane@example.com', '+1987654321', '{"make": "Toyota", "model": "Camry", "year": 2022, "color": "Blue", "license_plate": "ABC123"}');
```

### Step 3: Get Supabase Credentials
1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL**
   - **anon public** key
   - **service_role** key (keep this secret!)

## 3. OpenAI API Setup

### Step 1: Create OpenAI Account
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or sign in
3. Verify your phone number

### Step 2: Create API Key
1. Go to **API keys** in the dashboard
2. Click **Create new secret key**
3. Name it "RouteWise AI"
4. Copy the key (starts with `sk-`)
5. **Important**: Save this key securely - you won't see it again!

### Step 3: Add Billing (Required)
1. Go to **Billing** > **Payment methods**
2. Add a credit card
3. Set usage limits if desired

## 4. Google Maps API Setup

### Step 1: Create Google Cloud Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project or select existing one
3. Enable billing for the project

### Step 2: Enable APIs
1. Go to **APIs & Services** > **Library**
2. Enable these APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Directions API**
   - **Geocoding API**

### Step 3: Create API Key
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the API key
4. Click **Restrict Key** and:
   - Add application restrictions (HTTP referrers)
   - Add `http://localhost:3000/*`
   - Restrict to the APIs you enabled above

## 5. Spotify API Setup

### Step 1: Create Spotify App
1. Go to [developer.spotify.com](https://developer.spotify.com)
2. Log in with Spotify account
3. Go to **Dashboard** > **Create app**
4. Fill in app details:
   - **App name**: RouteWise AI
   - **App description**: Rideshare music integration
   - **Redirect URI**: `http://localhost:3000/api/spotify/callback`
   - **API/SDKs**: Web API

### Step 2: Get Credentials
1. Go to your app settings
2. Copy:
   - **Client ID**
   - **Client Secret** (click "View client secret")

## 6. OpenWeatherMap API Setup

### Step 1: Create Account
1. Go to [openweathermap.org/api](https://openweathermap.org/api)
2. Sign up for free account
3. Verify email

### Step 2: Get API Key
1. Go to **API keys** in your account
2. Copy the default key or create a new one
3. Free tier allows 1000 calls/day

## 7. Environment Configuration

Create `.env.local` file in your project root:

```env
# Auth0 Configuration
AUTH0_SECRET=your-long-random-secret-here
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://YOUR_AUTH0_DOMAIN
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret

# Auth0 Management API (Machine-to-Machine)
AUTH0_M2M_CLIENT_ID=your_m2m_client_id
AUTH0_M2M_CLIENT_SECRET=your_m2m_client_secret
AUTH0_DOMAIN=your_auth0_domain

# OpenAI
OPENAI_API_KEY=sk-your_openai_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Spotify
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Weather API
OPENWEATHER_API_KEY=your_openweather_api_key

# Demo Mode (set to 'false' when using real credentials)
DEMO_MODE=false
```

## 8. Testing Your Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run Type Check
```bash
npm run type-check
```

### Step 3: Start Development Server
```bash
npm run dev
```

### Step 4: Test Authentication
1. Go to `http://localhost:3000`
2. Try logging in with Auth0
3. Check user appears in Auth0 dashboard

### Step 5: Test Database
```bash
npm run demo
```

The demo should now use real APIs instead of mock data.

## 9. Production Deployment

### Environment Variables
1. Set all environment variables in your production environment
2. Update URLs from `localhost:3000` to your production domain
3. Update Auth0 callback URLs
4. Restrict API keys to your production domain

### Security Checklist
- [ ] All API keys are properly restricted
- [ ] Auth0 URLs updated for production
- [ ] Database has proper row-level security
- [ ] Environment variables are secure
- [ ] Rate limiting is configured
- [ ] HTTPS is enabled

## 10. Troubleshooting

### Common Issues

**Auth0 Login Issues**:
- Check callback URLs match exactly
- Verify domain configuration
- Check application type (Regular Web App)

**Database Connection Issues**:
- Verify Supabase URL and keys
- Check database schema is created
- Ensure RLS policies allow access

**API Key Issues**:
- Verify keys haven't expired
- Check API quotas and billing
- Ensure proper restrictions are set

### Getting Help

1. Check the logs in your terminal/browser console
2. Verify all environment variables are set correctly
3. Test each service individually
4. Check service status pages for outages

## Next Steps

1. Customize the AI agent prompts in `agents/BaseAgent.ts`
2. Add more sophisticated user permissions logic
3. Implement real-time ride tracking
4. Add push notifications
5. Set up monitoring and analytics

---

**Note**: Keep all API keys and secrets secure. Never commit them to version control. Use environment variables and secret management services in production.