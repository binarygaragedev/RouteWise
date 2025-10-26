# 🧪 Full Production Testing & Verification Guide

## 📋 Complete End-to-End Testing for RouteWise AI

This guide walks through comprehensive testing of all production features to ensure everything works correctly.

---

## 🚀 Pre-Testing Checklist

Before running tests, ensure all setup is complete:

- [ ] **Vercel Environment Variables**: All 12+ variables configured
- [ ] **Auth0 Application**: Created with correct callback URLs and Token Vault
- [ ] **Supabase Database**: Tables created with RLS policies
- [ ] **OpenAI API**: Key configured and credits available
- [ ] **Google Maps API**: All 4 APIs enabled with restrictions  
- [ ] **Spotify API**: App created with proper redirect URIs
- [ ] **Weather API**: Key obtained and tested
- [ ] **Latest Deployment**: App redeployed with all environment variables

---

## 🔗 Production URLs for Testing

```bash
# Main Application
https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app

# Driver Login
https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/auth/login?returnTo=/driver&role=driver

# Passenger Login  
https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/auth/login?returnTo=/passenger&role=passenger

# Health Check
https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/health-check
```

---

## 🧪 Phase 1: Infrastructure Testing

### Test 1: Application Deployment
```bash
# Basic connectivity test
curl -I https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app

# Expected: HTTP 200 OK
```

### Test 2: Environment Variables
```bash
# Test environment configuration
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/config-check"

# Expected Response:
{
  "auth0": "configured",
  "database": "connected", 
  "openai": "available",
  "maps": "enabled",
  "spotify": "configured",
  "weather": "active"
}
```

### Test 3: Database Connectivity
```bash
# Test Supabase connection
curl -X POST "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/test-db" \
  -H "Content-Type: application/json"

# Expected: Database connection successful with table counts
```

---

## 🔐 Phase 2: Authentication Testing

### Test 4: Auth0 Integration

#### A. Manual Browser Testing:
1. **Visit Landing Page**: 
   - URL: `https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app`
   - Check: Modern UI loads correctly
   - Check: Both login buttons visible

2. **Test Driver Login**:
   - Click "Sign In as Driver" button
   - Should redirect to Auth0 login page
   - Complete login process
   - Should return to `/driver` page with driver dashboard

3. **Test Passenger Login**:
   - Open new incognito window
   - Click "Sign In as Passenger" button
   - Complete separate Auth0 login
   - Should return to `/passenger` page with booking interface

#### B. API Testing:
```bash
# Test authentication endpoints
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/auth/me"

# Test role-based access
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/auth/user" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Test 5: Token Vault Integration
```bash
# Test token storage for external APIs
curl -X POST "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/test-token-vault" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"service": "spotify"}'
```

---

## 🗄️ Phase 3: Database Operations Testing

### Test 6: User Management
```bash
# Create user profile
curl -X POST "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/users/create" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Driver",
    "email": "testdriver@routewise.ai",
    "userType": "driver"
  }'

# Get user profile
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/users/get?userId=USER_ID" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Test 7: Driver Profile Management
```bash
# Create driver profile
curl -X POST "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/driver-profiles/create" \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "licenseNumber": "DL12345678",
    "vehicleMake": "Toyota",
    "vehicleModel": "Camry",
    "vehicleYear": 2022,
    "vehiclePlate": "ABC123",
    "vehicleColor": "Black"
  }'

# Update driver availability
curl -X PUT "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/driver-profiles/update" \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isAvailable": true, "currentLatitude": 40.7589, "currentLongitude": -73.9851}'
```

### Test 8: Ride Management
```bash
# Create ride request
curl -X POST "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/rides/create" \
  -H "Authorization: Bearer YOUR_PASSENGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress": "Times Square, NYC",
    "pickupLatitude": 40.7589,
    "pickupLongitude": -73.9851,
    "destinationAddress": "Central Park, NYC", 
    "destinationLatitude": 40.7849,
    "destinationLongitude": -73.9653
  }'

# Get available rides (driver)
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/rides/available" \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN"

# Accept ride (driver)
curl -X PUT "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/rides/update" \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rideId": "RIDE_ID", "status": "accepted"}'
```

---

## 🌐 Phase 4: External API Integration Testing

### Test 9: Google Maps Integration
```bash
# Test geocoding
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/geocode/forward?address=Times%20Square,%20NYC"

# Test reverse geocoding
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/geocode/reverse?lat=40.7589&lng=-73.9851"

# Expected: Location data with formatted addresses
```

### Test 10: Weather API Integration
```bash
# Test weather data
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/weather/current?lat=40.7589&lng=-73.9851"

# Expected: Current weather conditions and forecast
```

### Test 11: Spotify Integration
```bash
# Test Spotify connection (requires user authorization)
curl -X POST "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/spotify/connect" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Test music preferences
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/spotify/preferences" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

---

## 🤖 Phase 5: AI Agents Testing

### Test 12: Route Optimization Agent
```bash
# Test ride preparation with AI
curl -X POST "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/agent/prepare-ride" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rideId": "RIDE_ID",
    "pickupLocation": {"lat": 40.7589, "lng": -73.9851},
    "destination": {"lat": 40.7849, "lng": -73.9653},
    "passengerPreferences": {"music": ["pop", "rock"], "temperature": "normal"}
  }'

# Expected: Optimized route with AI insights
```

### Test 13: Consent Negotiation Agent
```bash
# Test consent management
curl -X POST "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/agent/negotiate-consent" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "requestedPermissions": ["location", "music", "contacts"],
    "context": "ride_booking"
  }'

# Expected: Consent recommendations with explanations
```

### Test 14: AI Agent Logging
```bash
# Test agent audit trail
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/agent/logs?userId=USER_ID" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Expected: Complete log of AI agent actions
```

---

## 🖥️ Phase 6: User Interface Testing

### Test 15: Responsive Design
Test on multiple devices:
1. **Desktop** (Chrome, Firefox, Safari, Edge)
2. **Tablet** (iPad, Android tablet)
3. **Mobile** (iPhone, Android phone)

Check for:
- [ ] Glass morphism effects render correctly
- [ ] Gradient backgrounds display properly
- [ ] Buttons have hover animations
- [ ] Forms are responsive and usable
- [ ] Navigation works on all screen sizes

### Test 16: User Experience Flows

#### Driver Flow:
1. **Login** → Should redirect to driver dashboard
2. **Profile Setup** → Create driver profile with vehicle info
3. **Go Online** → Set availability status
4. **Accept Ride** → Receive and accept ride request
5. **Complete Ride** → Mark ride as completed

#### Passenger Flow:
1. **Login** → Should redirect to passenger interface
2. **Book Ride** → Enter pickup and destination
3. **Wait for Driver** → See ride status updates
4. **Track Ride** → Real-time ride progress
5. **Rate Experience** → Post-ride feedback

### Test 17: AI Experience Integration
In the driver dashboard, verify:
- [ ] AI Experience section displays properly
- [ ] Route optimization data shows
- [ ] Passenger insights are visible
- [ ] Driver assistance recommendations appear
- [ ] All AI panels are responsive

---

## 📊 Phase 7: Performance & Security Testing

### Test 18: Performance Metrics
```bash
# Test page load speeds
curl -w "@curl-format.txt" -o /dev/null -s "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app"

# Test API response times
time curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/health-check"
```

Expected metrics:
- **Page Load**: < 3 seconds
- **API Response**: < 1 second
- **First Contentful Paint**: < 2 seconds

### Test 19: Security Testing
```bash
# Test CORS headers
curl -H "Origin: https://evil-site.com" \
  "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/test"

# Test authentication bypass attempts
curl -X GET "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/users/get" \
  -H "Authorization: Bearer invalid-token"

# Expected: Proper error responses and security headers
```

---

## ✅ Production Readiness Checklist

### Critical Features:
- [ ] **Authentication**: Auth0 login/logout working for both roles
- [ ] **Database**: All CRUD operations working with RLS
- [ ] **AI Agents**: At least 2 agents responding correctly
- [ ] **External APIs**: Google Maps and OpenAI functioning
- [ ] **User Interface**: Responsive design on all devices
- [ ] **Security**: Proper authentication and authorization

### Performance Standards:
- [ ] **Page Load Speed**: < 3 seconds on 3G connection
- [ ] **API Response Time**: < 1 second for most endpoints
- [ ] **Database Queries**: < 500ms average response time
- [ ] **Error Rate**: < 1% for all endpoints

### Security Requirements:
- [ ] **HTTPS Only**: All traffic encrypted
- [ ] **Authentication Required**: Protected routes secured
- [ ] **Role-Based Access**: Proper permissions enforced
- [ ] **Input Validation**: All user inputs sanitized
- [ ] **Rate Limiting**: API abuse prevention active

---

## 🎯 Contest Demo Scenarios

### Scenario 1: Complete Driver Journey
1. **Login as Driver** → Authenticate with Auth0
2. **Set Up Profile** → Add vehicle information
3. **Go Online** → Mark as available
4. **Receive Ride** → Get AI-optimized ride request
5. **AI Assistance** → See passenger preferences and route optimization
6. **Complete Ride** → Demonstrate earnings and rating

### Scenario 2: Complete Passenger Journey  
1. **Login as Passenger** → Authenticate with different Auth0 account
2. **Set Preferences** → Configure music and comfort preferences
3. **Book Ride** → Request ride with AI fare estimation
4. **Get Matched** → AI finds optimal driver
5. **Track Ride** → Real-time updates with AI insights
6. **Complete Journey** → Rate experience

### Scenario 3: AI Security Demonstration
1. **Show Token Vault** → Secure API access for agents
2. **Demonstrate Permissions** → Role-based AI capabilities
3. **Audit Trail** → Complete logging of AI actions
4. **Emergency Features** → Safety monitoring and alerts

---

## 🚨 Troubleshooting Common Issues

### Authentication Problems:
```bash
# Check Auth0 configuration
curl -X GET "https://your-tenant.auth0.com/.well-known/jwks.json"

# Verify callback URLs match exactly
# Check environment variables are set correctly
```

### Database Connection Issues:
```bash
# Test Supabase connectivity
curl -X GET "https://your-project-id.supabase.co/rest/v1/users" \
  -H "apikey: YOUR_SUPABASE_KEY"
```

### API Integration Failures:
```bash
# Test each API individually
# Check rate limits and quotas
# Verify API keys are correctly set
```

---

## 🎉 Success Criteria

The RouteWise AI production deployment is considered successful when:

1. **✅ All test scenarios pass** without critical errors
2. **✅ Performance meets benchmarks** (load times, response times)
3. **✅ Security requirements satisfied** (authentication, authorization)
4. **✅ AI agents demonstrate** intelligent behavior with proper security
5. **✅ User experience is polished** and professional
6. **✅ Contest demo scenarios** work flawlessly

**Congratulations!** 🎊 Once all tests pass, RouteWise AI is ready for production use and contest submission!