# 👤 Auth0 User Setup Guide

## Option 1: Manual User Creation (Recommended for Testing)

### Step 1: Create Test User in Dashboard
1. Go to: https://manage.auth0.com/dashboard
2. Navigate to **User Management** > **Users**
3. Click **"Create User"**
4. Fill in:
   - **Email**: `test@routewise.com`
   - **Password**: `TestUser123!`
   - **Email Verified**: ✅ Check this box
5. Click **"Create"**

### Step 2: Test Login
- Go to: http://localhost:3000
- Click "Sign In with Auth0"
- Login with: `test@routewise.com` / `TestUser123!`

---

## Option 2: Enable User Registration

### Step 1: Enable Signup in Auth0
1. Go to **Authentication** > **Database** > **Username-Password-Authentication**
2. In **Settings** tab:
   - ✅ **Disable Sign Ups**: Make sure this is **OFF**
3. **Save Changes**

### Step 2: Test Self-Registration
- Go to: http://localhost:3000
- Click "Sign In with Auth0"
- Click "Sign up" link
- Create account with your email

---

## Option 3: Add Multiple Test Users

### Common Test Users to Create:
```
1. Admin User:
   Email: admin@routewise.com
   Password: AdminUser123!

2. Driver User:
   Email: driver@routewise.com
   Password: DriverUser123!

3. Regular User:
   Email: user@routewise.com
   Password: RegularUser123!
```

### Step 1: Bulk Create Users
1. In Auth0 Dashboard > **User Management** > **Users**
2. Click **"Create User"** for each
3. Set **Email Verified**: ✅ for all

---

## Testing Different User Scenarios

### Test Authentication Flow:
1. **Login**: http://localhost:3000 → "Sign In"
2. **Dashboard**: Should redirect to protected dashboard
3. **Logout**: Test logout functionality
4. **Profile**: View user profile information

### Test User Data in App:
- Dashboard shows user email and profile
- User preferences can be saved
- Ride history is user-specific

---

## Troubleshooting

### "User not found" Error:
- Make sure **Email Verified** is checked in Auth0
- Check spelling of email/password
- Verify user exists in Auth0 dashboard

### "Access Denied" Error:
- Check Auth0 application settings
- Verify callback URLs are correct
- Make sure user has proper permissions

### Next Steps After User Creation:
1. ✅ Create test user
2. ✅ Test login/logout flow  
3. 🔄 Set up real API keys (OpenAI, Supabase, etc.)
4. 🔄 Test AI agents with real user data