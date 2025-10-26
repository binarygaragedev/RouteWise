# 🔐 Production Environment Variables Setup Guide

## 📋 Complete List of Required Environment Variables

Copy these to your Vercel Dashboard under **Settings > Environment Variables**:

### 🔑 Auth0 Configuration
```bash
AUTH0_SECRET=use-[openssl rand -hex 32]-or-32-char-random-string
AUTH0_BASE_URL=https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
```

### 🗄️ Database Configuration
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 🤖 AI Services
```bash
OPENAI_API_KEY=sk-your-openai-api-key
```

### 🌐 External APIs
```bash
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
WEATHER_API_KEY=your-openweathermap-api-key
```

### 🌍 App Configuration
```bash
NEXT_PUBLIC_APP_URL=https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app
```

---

## 🚀 Quick Setup Instructions

### 1. Access Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find your **routewise-ai** project
3. Click **Settings** tab
4. Click **Environment Variables**

### 2. Add Each Variable
For each variable above:
1. Click **Add New**
2. Enter the **Key** (e.g., `AUTH0_SECRET`)
3. Enter the **Value** (the actual credential)
4. Select **Production**, **Preview**, and **Development** environments
5. Click **Save**

### 3. Generate AUTH0_SECRET
```bash
# On your local machine, run:
openssl rand -hex 32

# Or use this online generator:
# https://generate-secret.vercel.app/32
```

---

## 📖 Where to Get Each Credential

### Auth0 (Step 2)
- Sign up at [auth0.com](https://auth0.com)
- Create new application
- Get credentials from Application Settings

### Supabase (Step 3)  
- Sign up at [supabase.com](https://supabase.com)
- Create new project
- Get URL and keys from Project Settings > API

### OpenAI
- Sign up at [platform.openai.com](https://platform.openai.com)
- Go to API Keys section
- Create new API key

### Google Maps API
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Enable Maps JavaScript API & Geocoding API
- Create API key in Credentials

### Spotify API
- Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- Create new app
- Get Client ID and Client Secret

### Weather API
- Sign up at [OpenWeatherMap](https://openweathermap.org/api)
- Get free API key from account dashboard

---

## ⚡ Quick Command Reference

```bash
# Redeploy after adding environment variables
vercel --prod

# Check deployment logs
vercel logs https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app

# Test environment variables
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/test"
```

## 🔄 Next Steps After Adding Variables

1. **Redeploy** the application to apply new environment variables
2. **Set up Auth0** application with correct callback URLs
3. **Deploy Supabase** database schema  
4. **Test** all integrations work properly

The environment variables are the foundation - once these are configured, we can proceed with the service-specific setups!