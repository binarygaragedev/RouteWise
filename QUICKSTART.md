# ⚡ RouteWise AI - Quick Start (1 Week Implementation)

This guide walks you through building RouteWise AI from scratch in 7 days.

## 📅 Day-by-Day Plan

### **DAY 1: Foundation Setup (Sunday)**

**Morning (4 hours)**

1. **Create Next.js project**
```bash
npx create-next-app@latest routewise-ai --typescript --tailwind --app
cd routewise-ai
```

2. **Install dependencies**
```bash
npm install @auth0/nextjs-auth0 @supabase/supabase-js openai axios
```

3. **Set up Auth0**
- Create Auth0 account: https://auth0.com
- Create Regular Web Application
- Create M2M Application for agents
- Copy all credentials

4. **Configure `.env.local`**
```bash
cp .env.example .env.local
# Fill in Auth0 credentials
```

**Afternoon (4 hours)**

5. **Set up Supabase**
- Create Supabase account: https://supabase.com
- Create new project
- Run SQL from `lib/db.ts`
- Add Supabase credentials to `.env.local`

6. **Create basic file structure**
```bash
mkdir -p lib agents services app/api/agent
```

7. **Test Auth0 login**
- Copy `lib/auth0.ts` code
- Create login page
- Test authentication flow

**✅ Day 1 Goal: Users can log in with Auth0**

---

### **DAY 2: Core Agent Infrastructure (Monday)**

**Morning (4 hours)**

1. **Build BaseAgent class** (`agents/BaseAgent.ts`)
- Agent authentication
- Permission checking
- Audit logging
- AI integration

2. **Build Token Vault** (`lib/tokenVault.ts`)
- Token storage
- Token retrieval with permission checks
- Refresh logic

3. **Test M2M authentication**
```bash
npx ts-node -e "
import { getAgentToken } from './lib/tokenVault';
getAgentToken().then(console.log);
"
```

**Afternoon (4 hours)**

4. **Build Ride Preparation Agent**
- Start with stub (return mock data)
- Add permission checking
- Test with different user roles

5. **Create test users in Auth0**
- Passenger: John (shares music + route)
- Driver: Sarah (verified, 4.9★)
- Driver: Mike (new, 4.2★)

**✅ Day 2 Goal: BaseAgent works, can authenticate and check permissions**

---

### **DAY 3: External API Integration (Tuesday)**

**Morning (4 hours)**

1. **Set up Spotify OAuth**
- Register app: https://developer.spotify.com
- Get Client ID/Secret
- Add to `.env.local`
- Create `services/spotify.ts`

2. **Implement Spotify token exchange**
```typescript
// Create OAuth flow
// Store token in Token Vault
// Test fetching playlists
```

3. **Test Spotify integration**
```bash
# Create test endpoint
# Connect Spotify account
# Verify Token Vault stores token
```

**Afternoon (4 hours)**

4. **Add Google Maps API** (`services/maps.ts`)
- Get API key: https://console.cloud.google.com
- Implement route calculation
- Mock routes for testing (avoid API costs)

5. **Add Weather API** (`services/weather.ts`)
- Get API key: https://openweathermap.org
- Fetch current weather
- Generate climate recommendations

**✅ Day 3 Goal: All external APIs working, Token Vault functional**

---

### **DAY 4: Complete Ride Preparation Agent (Wednesday)**

**Morning (4 hours)**

1. **Implement full agent logic**
- Permission checking for all categories
- Parallel API calls
- AI insight generation with OpenAI

2. **Add AI prompt engineering**
```typescript
// Create context-aware prompts
// Handle different permission scenarios
// Parse AI responses into structured data
```

**Afternoon (4 hours)**

3. **Build API endpoint** (`app/api/agent/prepare-ride/route.ts`)
- POST endpoint to trigger agent
- Authentication check
- Return insights

4. **Test end-to-end**
```bash
# Create test ride in database
# Call API endpoint
# Verify insights generated
# Check audit logs
```

**✅ Day 4 Goal: Ride Preparation Agent fully functional with all APIs**

---

### **DAY 5: Consent & Safety Agents (Thursday)**

**Morning (4 hours)**

1. **Build Consent Negotiation Agent**
- Check driver eligibility
- Generate AI request message
- Send notification (mock for now)

2. **Implement consent approval flow**
- Update Auth0 user metadata
- Time-based expiration
- Test approval/denial

**Afternoon (4 hours)**

3. **Build Safety Monitoring Agent**
- Start/stop monitoring
- Periodic safety checks
- Emergency override logic

4. **Create API endpoints**
```typescript
POST /api/agent/negotiate-consent
PATCH /api/agent/negotiate-consent
POST /api/agent/monitor-safety
```

**✅ Day 5 Goal: All 3 main agents working, APIs functional**

---

### **DAY 6: Frontend & Demo (Friday)**

**Morning (4 hours)**

1. **Build driver dashboard**
```typescript
// Show ride insights
// Display passenger preferences (authorized only)
// Request additional consent button
// Show permission levels
```

2. **Build passenger preferences page**
```typescript
// Preference input forms
// Consent control toggles
// Connected accounts (Spotify)
```

**Afternoon (4 hours)**

3. **Create demo script** (`scripts/demo.ts`)
- Demonstrate all agents
- Show Auth0 features
- Generate sample output

4. **Test complete workflow**
```bash
npm run demo
```

**✅ Day 6 Goal: Basic UI working, impressive demo script ready**

---

### **DAY 7: Polish & Submission (Saturday)**

**Morning (4 hours)**

1. **Record demo video**
- Show passenger setting preferences
- Show consent controls
- Demonstrate agent execution
- Show Auth0 dashboard (permissions, audit logs)
- Show emergency override

2. **Take screenshots**
- Dashboard with insights
- Consent management UI
- Auth0 configuration
- Audit logs

**Afternoon (4 hours)**

3. **Write DEV.to post**
- Use submission template
- Add screenshots
- Include code snippets
- Explain Auth0 integration

4. **Deploy to Vercel**
```bash
vercel deploy
```

5. **Final testing with judges' credentials**
```typescript
// Create test accounts
// Test all scenarios
// Verify everything works
```

**✅ Day 7 Goal: Video recorded, post written, deployed, submitted!**

---

## 🎯 Minimum Viable Product (MVP)

If you're short on time, focus on these essentials:

### Must Have:
- ✅ Auth0 login (users + agents)
- ✅ Ride Preparation Agent (main showcase)
- ✅ Token Vault for Spotify
- ✅ Permission checking
- ✅ Basic dashboard showing insights

### Nice to Have:
- ⭐ Consent Negotiation Agent
- ⭐ Safety Monitoring Agent
- ⭐ Multiple external APIs
- ⭐ Beautiful UI

### Can Skip:
- ❌ Full production features
- ❌ Mobile app
- ❌ Real-time notifications
- ❌ Advanced analytics

---

## 🐛 Common Issues & Solutions

### Issue 1: Auth0 M2M Token Not Working
```typescript
// Solution: Check audience matches your API identifier
const token = await axios.post(`${AUTH0_DOMAIN}/oauth/token`, {
  audience: 'https://routewise-api', // Must match API identifier
  // ...
});
```

### Issue 2: Spotify Token Vault Failing
```typescript
// Solution: Ensure refresh token is stored
await tokenVault.storeToken(userId, 'spotify', {
  access_token,
  refresh_token, // Don't forget this!
  expires_in,
  scopes
});
```

### Issue 3: Permission Checks Not Working
```typescript
// Solution: Set user_metadata in Auth0 correctly
await auth0Manager.updateUserMetadata(userId, {
  consent_settings: { // Must be nested correctly
    music: {
      share_with: 'all_drivers'
    }
  }
});
```

---

## 📚 Resources

### Auth0
- [Quick Start](https://auth0.com/docs/quickstart)
- [Management API](https://auth0.com/docs/api/management/v2)
- [Token Vault Guide](https://auth0.com/docs/secure/tokens)

### APIs
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Google Maps Platform](https://developers.google.com/maps/documentation)
- [OpenAI API](https://platform.openai.com/docs)

### Testing
- [Auth0 Test Users](https://auth0.com/docs/manage-users/user-accounts/create-users)
- [Postman Collection](link-to-collection)

---

## 💡 Pro Tips

1. **Use Mock Data Early**
   - Don't wait for APIs to work
   - Create mock responses
   - Swap in real APIs later

2. **Test Permission Scenarios**
   - Create 3 test users with different permissions
   - Verify each sees different data
   - Show this in video demo

3. **Make Audit Logs Visible**
   - Create simple page showing logs
   - Judges love seeing the audit trail
   - Shows Auth0 compliance features

4. **Record Demo Early**
   - Don't wait until Day 7
   - Record working features as you build
   - If something breaks, you have backup

5. **Keep It Simple**
   - Focus on one agent done well
   - Better than 4 half-working agents
   - Quality > Quantity

---

## 🚨 Troubleshooting

**Agent not authenticating?**
```bash
# Check M2M app has correct permissions
# Verify API identifier matches
# Test token manually with Postman
```

**Permissions not working?**
```bash
# Verify user_metadata structure in Auth0
# Check driver verification level
# Test with Auth0 API Explorer
```

**APIs failing?**
```bash
# Use mock data initially
# Check API keys in .env.local
# Verify Token Vault token storage
```

---

## ✅ Pre-Submission Checklist

- [ ] Auth0 login