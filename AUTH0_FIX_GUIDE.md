# 🚨 Auth0 Configuration Fix

Your Auth0 authentication error is likely due to missing callback URL configuration.

## 🔧 **IMMEDIATE FIX NEEDED:**

### **1. Go to your Auth0 Dashboard:**
- URL: https://manage.auth0.com/dashboard
- Navigate to: Applications > Your RouteWise App

### **2. Update Application Settings:**

**Allowed Callback URLs:**
```
http://localhost:3001/api/auth/callback
```

**Allowed Logout URLs:**
```
http://localhost:3001
```

**Allowed Web Origins:**
```
http://localhost:3001
```

**Allowed Origins (CORS):**
```
http://localhost:3001
```

### **3. Click "Save Changes"**

## 🔍 **Your Current Configuration:**
- **Auth0 Domain:** genai-7843125719764479.eu.auth0.com
- **Client ID:** QbYEzFQID9ABdcmuGzHwanUXOGeGhTvx
- **App URL:** http://localhost:3001

## 🔄 **After Fixing in Auth0:**
1. Save the Auth0 application settings
2. Restart your dev server: `npm run dev`
3. Try accessing: http://localhost:3001

## 📋 **Alternative: Enable Demo Mode Temporarily**

If you want to test the app while fixing Auth0, you can temporarily re-enable demo mode:

```bash
# In .env.local, change:
DEMO_MODE=true
```

This will bypass Auth0 and let you test the app functionality.

## 🛠️ **Still Having Issues?**

Common problems:
1. **Wrong Domain:** Make sure you're using the EU domain (genai-7843125719764479.eu.auth0.com)
2. **Application Type:** Must be "Regular Web Application" not SPA
3. **Port Mismatch:** App is running on 3001, make sure Auth0 URLs match
4. **Typos:** Double-check Client ID and Secret

## ✅ **Test Auth0 Setup:**
After fixing, try:
1. Go to http://localhost:3001
2. Click "Sign In with Auth0"
3. Should redirect to Auth0 login page
4. After login, should redirect back to your app