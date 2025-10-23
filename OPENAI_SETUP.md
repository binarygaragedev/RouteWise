# 🤖 OpenAI API Setup Guide

## Step 1: Create OpenAI Account
1. Go to: https://platform.openai.com/signup
2. Sign up with email or Google/Microsoft account
3. Verify your email address

## Step 2: Add Billing Information
⚠️ **REQUIRED**: OpenAI requires a payment method
1. Go to: https://platform.openai.com/account/billing
2. Click "Add payment method"
3. Add credit card or PayPal
4. Set a usage limit (recommended: $20/month for testing)

## Step 3: Create API Key
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it: "RouteWise AI"
4. **IMPORTANT**: Copy the key immediately (starts with `sk-`)
5. You won't be able to see it again!

## Step 4: Update Environment
Replace this line in `.env.local`:
```
OPENAI_API_KEY=sk-demo-key
```

With your real key:
```
OPENAI_API_KEY=sk-your_actual_key_here
```

## Cost Estimate:
- **Ride Preparation Agent**: ~$0.01-0.05 per ride
- **Safety Monitoring**: ~$0.005-0.02 per emergency
- **Monthly estimate**: $5-20 for moderate usage

## Test Your Setup:
After adding the key, the AI agents will use real OpenAI responses instead of demo messages.