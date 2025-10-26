# 🌐 External API Keys Configuration Guide

## 📋 Complete Setup for All External Service Integrations

RouteWise AI integrates with multiple external services to provide comprehensive functionality. Here's how to set up each API:

---

## 🤖 OpenAI API (Required for AI Agents)

### Setup Steps:
1. **Sign up** at [platform.openai.com](https://platform.openai.com)
2. **Verify your account** (may require phone verification)
3. **Add payment method** (required for API access)
4. **Create API key**:
   - Go to API Keys section
   - Click "Create new secret key"
   - Name: `RouteWise AI Production`
   - Copy the key immediately (won't be shown again)

### Configuration:
```bash
# Add to Vercel Environment Variables
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Recommended Settings:
- **Model**: GPT-4 (for best AI agent performance)
- **Rate Limit**: Set reasonable limits to control costs
- **Usage Monitoring**: Enable alerts for cost control

### Test Command:
```bash
curl -X POST "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/agent/test" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test AI agent functionality"}'
```

---

## 🗺️ Google Maps API (Required for Route Optimization)

### APIs to Enable:
1. **Maps JavaScript API** - For interactive maps
2. **Geocoding API** - For address to coordinates conversion
3. **Directions API** - For route optimization
4. **Places API** - For location suggestions

### Setup Steps:
1. **Go to** [Google Cloud Console](https://console.cloud.google.com)
2. **Create new project** or select existing one
3. **Enable APIs**:
   - Go to APIs & Services > Library
   - Search and enable each API listed above
4. **Create credentials**:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "API Key"
   - Restrict key to specific APIs (recommended)
   - Add HTTP referrer restrictions for security

### Configuration:
```bash
# Add to Vercel Environment Variables
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

### Security Settings (Recommended):
```
Application restrictions:
- HTTP referrers (web sites)
- https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/*

API restrictions:
- Maps JavaScript API
- Geocoding API  
- Directions API
- Places API
```

### Test Command:
```bash
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/geocode/reverse?lat=40.7589&lng=-73.9851"
```

---

## 🎵 Spotify Web API (For Music Preferences)

### Setup Steps:
1. **Go to** [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. **Log in** with Spotify account (create if needed)
3. **Create app**:
   - App name: `RouteWise AI`
   - App description: `AI-powered rideshare platform`
   - Website: `https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app`
   - Redirect URI: `https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/auth/callback/spotify`

### Configuration:
```bash
# Add to Vercel Environment Variables
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
```

### Required Scopes:
```
user-read-private
user-read-email
playlist-read-private
user-top-read
user-read-currently-playing
```

### Test Command:
```bash
curl -X POST "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/spotify/test" \
  -H "Content-Type: application/json"
```

---

## 🌤️ OpenWeatherMap API (For Weather Context)

### Setup Steps:
1. **Sign up** at [OpenWeatherMap](https://openweathermap.org/api)
2. **Choose plan**:
   - Free tier: 60 calls/minute, 1,000,000 calls/month
   - Paid plans available for higher limits
3. **Get API key**:
   - Go to API keys section in dashboard
   - Copy your default API key
   - Or create a new one for this project

### Configuration:
```bash
# Add to Vercel Environment Variables
WEATHER_API_KEY=your-openweathermap-api-key
```

### API Endpoints Used:
- **Current Weather**: For real-time conditions
- **5 Day Forecast**: For trip planning
- **One Call API**: For comprehensive weather data

### Test Command:
```bash
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/weather/test?lat=40.7589&lng=-73.9851"
```

---

## 🔧 Complete Environment Variables List

Add all these to your Vercel Dashboard under **Settings > Environment Variables**:

```bash
# AI Services
OPENAI_API_KEY=sk-your-openai-api-key

# Maps & Location
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Music Integration  
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# Weather Data
WEATHER_API_KEY=your-openweathermap-api-key

# Auth0 (from previous setup)
AUTH0_SECRET=your-32-character-secret
AUTH0_BASE_URL=https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret

# Database (from previous setup)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app
```

---

## 💰 Cost Estimates (Monthly)

### Free Tier Limits:
- **OpenAI**: $5 free credit initially, then pay-per-use
- **Google Maps**: $200 free credit monthly
- **Spotify**: Free for development, paid for commercial use
- **Weather API**: Free tier with 1M calls/month

### Expected Costs for Small-Medium Usage:
- **OpenAI**: $10-50/month (depends on AI agent usage)
- **Google Maps**: $0-20/month (within free credit for most apps)
- **Spotify**: $0 (free tier sufficient for testing)
- **Weather**: $0 (free tier sufficient)

### Cost Optimization Tips:
1. **Cache API responses** where possible
2. **Implement rate limiting** to prevent overuse
3. **Monitor usage** regularly through each service's dashboard
4. **Set up billing alerts** to avoid surprises

---

## 🔒 Security Best Practices

### API Key Security:
1. **Never commit API keys** to version control
2. **Use environment variables** for all credentials
3. **Implement key rotation** regularly
4. **Set up monitoring** for unusual usage patterns

### Access Restrictions:
1. **Google Maps**: Restrict to your domain only
2. **Spotify**: Use HTTPS redirect URIs only
3. **OpenAI**: Monitor usage for abuse
4. **Weather API**: Consider IP restrictions if needed

### Monitoring Setup:
```bash
# Set up alerts for each service
# Google Cloud: Billing alerts
# OpenAI: Usage notifications
# Spotify: App monitoring
# Weather API: Usage tracking
```

---

## 🧪 Testing All Integrations

### Comprehensive Test Script:
```bash
# Test OpenAI integration
curl -X POST "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/test/openai"

# Test Google Maps integration  
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/test/maps"

# Test Spotify integration
curl -X POST "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/test/spotify"

# Test Weather API integration
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/test/weather"

# Test all integrations together
curl -X POST "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/test/all-integrations"
```

### Expected Response Format:
```json
{
  "success": true,
  "service": "openai|maps|spotify|weather",
  "status": "connected",
  "test_result": {...}
}
```

---

## 🚀 Deploy and Test

After adding all environment variables:

```bash
# Redeploy to apply new environment variables
vercel --prod

# Run comprehensive integration test
curl -X POST "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/health-check" \
  -H "Content-Type: application/json"
```

## ✅ Verification Checklist

- [ ] OpenAI API key obtained and tested
- [ ] Google Maps APIs enabled with proper restrictions
- [ ] Spotify app created with correct redirect URIs
- [ ] Weather API key obtained and validated  
- [ ] All environment variables added to Vercel
- [ ] Security restrictions properly configured
- [ ] Cost monitoring and alerts set up
- [ ] All API integrations tested successfully

Once all external APIs are configured, proceed to the final end-to-end testing phase!