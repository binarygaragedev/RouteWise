# 🔐 Auth0 Production Setup for RouteWise AI

## 📋 Complete Auth0 Configuration Guide

### Step 1: Create Auth0 Account and Application

1. **Sign up** at [auth0.com](https://auth0.com) 
2. **Create new tenant** (e.g., `routewise-prod`)
3. **Create Application**:
   - Go to Applications > Create Application
   - Name: `RouteWise AI Production`
   - Type: `Regular Web Applications`
   - Click Create

### Step 2: Configure Application Settings

In your Auth0 Application Settings:

#### Basic Information
```
Name: RouteWise AI Production
Domain: your-tenant.auth0.com
Client ID: [copy this to VERCEL]
Client Secret: [copy this to VERCEL]
```

#### Application URIs
```bash
Allowed Callback URLs:
https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/auth/callback

Allowed Logout URLs:
https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app

Allowed Web Origins:
https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app

Allowed Origins (CORS):
https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app
```

#### Advanced Settings

**Grant Types** (Enable these):
- [x] Authorization Code
- [x] Refresh Token  
- [x] Client Credentials

**Token Endpoint Authentication Method:**
- Select: `Post`

### Step 3: Enable Auth0 for AI Agents Features

#### A. Token Vault Configuration
1. Go to **Applications > Your App > Advanced Settings**
2. Find **Token Vault** section
3. Enable Token Vault
4. Configure external service integrations:

```json
{
  "spotify": {
    "client_id": "your-spotify-client-id",
    "client_secret": "your-spotify-client-secret",
    "scopes": ["user-read-private", "user-read-email", "playlist-read-private"]
  },
  "google-maps": {
    "api_key": "your-google-maps-api-key"
  },
  "weather": {
    "api_key": "your-weather-api-key"
  }
}
```

#### B. API Scopes Configuration
1. Go to **APIs** section
2. Create new API: `RouteWise AI API`
3. Add these scopes:
```
ride:read          - Read ride information
ride:write         - Create and update rides  
driver:read        - Read driver profiles
driver:write       - Update driver information
passenger:read     - Read passenger data
passenger:write    - Update passenger preferences
ai-agent:execute   - Allow AI agents to act on behalf of user
emergency:access   - Access emergency services (safety agent)
```

### Step 4: Configure User Roles and Permissions

#### A. Create Roles
1. Go to **User Management > Roles**
2. Create roles:

**Driver Role:**
```
Name: driver
Description: Rideshare driver with vehicle and earnings access
Permissions: 
- ride:read, ride:write
- driver:read, driver:write  
- ai-agent:execute
```

**Passenger Role:**
```
Name: passenger  
Description: Rideshare passenger with booking capabilities
Permissions:
- ride:read, ride:write
- passenger:read, passenger:write
- ai-agent:execute
```

**Admin Role:**
```
Name: admin
Description: Platform administrator
Permissions: ALL
```

#### B. Configure Role Assignment Rules
1. Go to **Auth Pipeline > Rules**
2. Create rule: `Assign Roles Based on URL Parameter`

```javascript
function assignRoleFromURL(user, context, callback) {
  const requestedRole = context.request.query.role;
  
  if (requestedRole === 'driver') {
    context.authorization = context.authorization || {};
    context.authorization.roles = ['driver'];
  } else if (requestedRole === 'passenger') {
    context.authorization = context.authorization || {};
    context.authorization.roles = ['passenger'];  
  }
  
  callback(null, user, context);
}
```

### Step 5: Security and Compliance Settings

#### A. Enable Security Features
1. **Brute Force Protection**: Enable
2. **Breached Password Detection**: Enable  
3. **Multi-factor Authentication**: Configure (recommended)

#### B. Audit Logging
1. Go to **Monitoring > Logs**
2. Enable comprehensive logging
3. Configure log streams for production monitoring

### Step 6: Test Auth0 Integration

#### A. Test Login Flow
```bash
# Test driver login
https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/auth/login?returnTo=/driver&role=driver

# Test passenger login  
https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/auth/login?returnTo=/passenger&role=passenger
```

#### B. Verify Token Claims
After login, check that tokens contain:
- User information
- Assigned roles
- Appropriate permissions
- Token Vault access

### Step 7: Environment Variables for Vercel

Add these to Vercel Dashboard:
```bash
AUTH0_SECRET=generate-32-character-secret
AUTH0_BASE_URL=https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-application-client-id
AUTH0_CLIENT_SECRET=your-application-client-secret
```

### Step 8: Production Deployment

```bash
# Redeploy with Auth0 configuration
vercel --prod

# Test authentication endpoints
curl https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/auth/me
```

---

## 🔧 Troubleshooting

### Common Issues:

**Callback URL Mismatch**
- Ensure exact URL match in Auth0 settings
- Check for trailing slashes

**Token Vault Not Working**
- Verify Token Vault is enabled in application settings
- Check external service credentials are correct

**Role Assignment Failing**  
- Verify rules are enabled and deployed
- Check URL parameter is being passed correctly

### Test Commands:
```bash
# Test Auth0 configuration
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/auth/login"

# Check user session
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/auth/me" \
  -H "Cookie: appSession=your-session-cookie"
```

## ✅ Verification Checklist

- [ ] Auth0 application created and configured
- [ ] Callback URLs match production domain exactly  
- [ ] Token Vault enabled for external API access
- [ ] Roles and permissions configured properly
- [ ] Security features enabled
- [ ] Environment variables added to Vercel
- [ ] Login/logout flow tested successfully
- [ ] AI agent permissions working

Once Auth0 is configured, proceed to Supabase database setup!