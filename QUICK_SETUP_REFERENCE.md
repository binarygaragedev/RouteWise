# Quick Setup Reference

## Essential Services & Credentials Needed

### 1. Auth0 (Authentication)
```
🌐 Website: auth0.com
📋 What you need:
   - Domain (e.g., dev-xyz.us.auth0.com)
   - Client ID & Secret (Regular Web App)
   - M2M Client ID & Secret (Machine-to-Machine)
   
🔧 Setup time: ~15 minutes
💰 Cost: Free tier available
```

### 2. Supabase (Database)
```
🌐 Website: supabase.com
📋 What you need:
   - Project URL
   - anon public key
   - service_role key
   
🔧 Setup time: ~10 minutes
💰 Cost: Free tier with 500MB database
```

### 3. OpenAI (AI Responses)
```
🌐 Website: platform.openai.com
📋 What you need:
   - API Key (starts with sk-)
   - Billing setup required
   
🔧 Setup time: ~5 minutes
💰 Cost: Pay per usage (~$0.002 per request)
```

### 4. Google Maps (Location Services)
```
🌐 Website: console.cloud.google.com
📋 What you need:
   - API Key with Maps/Places/Directions enabled
   - Billing account required
   
🔧 Setup time: ~10 minutes
💰 Cost: Free $200/month credit
```

### 5. Spotify (Music Integration)
```
🌐 Website: developer.spotify.com
📋 What you need:
   - Client ID & Secret
   
🔧 Setup time: ~5 minutes
💰 Cost: Free
```

### 6. OpenWeatherMap (Weather Data)
```
🌐 Website: openweathermap.org/api
📋 What you need:
   - API Key
   
🔧 Setup time: ~3 minutes
💰 Cost: Free tier (1000 calls/day)
```

## Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Edit .env.local with your credentials
# (See COMPLETE_SETUP_GUIDE.md for details)

# 4. Test the setup
npm run demo

# 5. Start development server
npm run dev
```

## Priority Setup Order

1. **Auth0** (required for user management)
2. **Supabase** (required for data storage)
3. **OpenAI** (required for AI responses)
4. **Google Maps** (for location features)
5. **Spotify** (optional, for music preferences)
6. **OpenWeatherMap** (optional, for weather insights)

## Demo Mode vs Production

- **Demo Mode**: Uses mock data, no real API calls needed
- **Production Mode**: Requires all real credentials

To switch from demo to production:
```env
# In .env.local
DEMO_MODE=false
```

## Getting Help

1. 📖 Read `COMPLETE_SETUP_GUIDE.md` for detailed instructions
2. 🐛 Check console logs for specific error messages
3. 🔍 Verify each credential individually
4. 🚀 Start with demo mode, then add real credentials one by one