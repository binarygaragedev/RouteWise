# 🚀 Production Deployment Guide

## Quick Vercel Deployment (Recommended)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** Y
- **Which scope?** Your personal account
- **Link to existing project?** N
- **Project name?** routewise-ai
- **Directory?** ./ (current)

### Step 4: Add Environment Variables
After deployment, go to:
1. https://vercel.com/dashboard
2. Your project → Settings → Environment Variables
3. Add all variables from your `.env.local`:
   - AUTH0_SECRET
   - AUTH0_BASE_URL (change to your new Vercel URL)
   - AUTH0_ISSUER_BASE_URL
   - AUTH0_CLIENT_ID
   - AUTH0_CLIENT_SECRET
   - AUTH0_M2M_CLIENT_ID
   - AUTH0_M2M_CLIENT_SECRET
   - AUTH0_DOMAIN
   - OPENAI_API_KEY
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   - DEMO_MODE=false

### Step 5: Update Auth0 Callback URLs
In Auth0 Dashboard, add your production URL:
- **Allowed Callback URLs**: `https://your-app.vercel.app/api/auth/callback`
- **Allowed Logout URLs**: `https://your-app.vercel.app`
- **Allowed Web Origins**: `https://your-app.vercel.app`

### Step 6: Test Production
Visit your live URL and test all functionality!

## Alternative: Other Hosting Options

### Netlify:
```bash
npm run build
# Deploy dist folder to Netlify
```

### Railway:
```bash
# Connect GitHub repo to Railway
# Add environment variables in dashboard
```

### Your Own Server:
```bash
npm run build
npm start
# Configure reverse proxy (nginx)
```

## What You Get:
- ✅ Live production URL
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments from Git
- ✅ Free tier (sufficient for testing)

## Cost:
- **Vercel Free**: Perfect for development/small projects
- **Vercel Pro ($20/month)**: For production applications