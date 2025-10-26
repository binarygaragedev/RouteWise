# 🚀 Vercel Deployment Guide for RouteWise AI

## Prerequisites

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

## Quick Deploy

### Option 1: One-Command Deploy
```bash
# Navigate to project directory
cd C:\projects\sample\routewise-ai

# Deploy to Vercel
vercel --prod
```

### Option 2: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - RouteWise AI"
   git branch -M main
   git remote add origin https://github.com/binarygaragedev/RouteWise.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and configure build settings

## Environment Variables Setup

After deployment, configure these in Vercel Dashboard > Settings > Environment Variables:

### 🔐 Auth0 Configuration
```
AUTH0_SECRET=generate-32-character-secret
AUTH0_BASE_URL=https://your-app.vercel.app
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
```

### 🗄️ Database & APIs
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
OPENAI_API_KEY=your-openai-key
GOOGLE_MAPS_API_KEY=your-maps-key
SPOTIFY_CLIENT_ID=your-spotify-id
SPOTIFY_CLIENT_SECRET=your-spotify-secret
WEATHER_API_KEY=your-weather-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Auth0 Production Setup

1. **Update Auth0 Application Settings**
   - Allowed Callback URLs: `https://your-app.vercel.app/api/auth/callback`
   - Allowed Logout URLs: `https://your-app.vercel.app`
   - Allowed Web Origins: `https://your-app.vercel.app`

2. **Enable AI Agents Features**
   - Go to Auth0 Dashboard > Applications > Your App
   - Enable "Token Vault" in Advanced Settings
   - Configure API scopes for external services

## Deployment Commands

```bash
# Deploy to preview (staging)
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs your-deployment-url
```

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Auth0 callback URLs updated
- [ ] Database tables created in Supabase
- [ ] API keys tested and working
- [ ] Test both driver and passenger flows
- [ ] Verify AI agents are functioning
- [ ] Check mobile responsiveness

## Troubleshooting

### Build Issues
```bash
# Test build locally first
npm run build
npm run start
```

### Environment Variables
```bash
# Check which variables are missing
vercel env ls
```

### Auth0 Issues
- Verify callback URLs match exactly
- Check that client secret is correctly set
- Ensure Auth0 domain is correct

## Custom Domain (Optional)

1. Go to Vercel Dashboard > Domains
2. Add your custom domain
3. Update Auth0 URLs to use custom domain
4. Update NEXT_PUBLIC_APP_URL environment variable

## Performance Optimization

The app is configured for optimal Vercel deployment with:
- Static optimization enabled
- API routes with appropriate timeouts
- Image optimization configured
- Build caching enabled

## ✅ Successful Deployment!

Your RouteWise AI app is now live at: 
**https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app**

### Production URLs:
- **Main App**: https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app
- **Driver Login**: https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app?role=driver  
- **Passenger Login**: https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app?role=passenger

### Next Steps for Production:
1. **Configure Environment Variables** in Vercel Dashboard
2. **Set up Auth0 Production App** with correct callback URLs
3. **Configure Supabase Production Database**
4. **Add API Keys** for Google Maps, OpenAI, Spotify, Weather APIs