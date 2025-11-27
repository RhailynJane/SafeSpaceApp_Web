# Sendbird Calls Setup Guide

## ⚠️ Important: Sendbird Chat vs Sendbird Calls

Your current Sendbird App ID (`E30F2BDE-F34E-464F-9689-7D5C443231A3`) is for **Sendbird Chat**, which handles text messaging only.

**Sendbird Calls** is a separate product for voice and video calling. You need to create a separate Sendbird Calls application.

## 🎯 Why Video Calling Failed

The error you saw (`Failed to fetch`) occurs because:
1. Sendbird Chat and Sendbird Calls are **different products**
2. Each requires its own App ID
3. The authentication endpoints are different

## 📋 Setup Instructions

### Option 1: Create Sendbird Calls Application (Recommended for Production)

1. **Go to Sendbird Dashboard**
   - Visit: https://dashboard.sendbird.com
   - Log in with your existing Sendbird account

2. **Create a New Calls Application**
   - Click "Create application"
   - Select "Calls" (NOT "Chat")
   - Name it: "SafeSpace Video Calls"
   - Choose your region (US/EU/Asia)

3. **Get Your Calls App ID**
   - Once created, copy the App ID from the dashboard
   - It will look similar to your Chat App ID format

4. **Update `.env.local`**
   ```env
   # Sendbird Chat (existing - for messaging)
   NEXT_PUBLIC_SENDBIRD_APP_ID=E30F2BDE-F34E-464F-9689-7D5C443231A3
   NEXT_PUBLIC_SENDBIRD_API_TOKEN=25425a601e47017a00b63cef73915a5488f94cd4
   NEXT_PUBLIC_SENDBIRD_ACCESS_TOKEN=28070714114d0c737f5dfc7524dedeff9af154c6
   SENDBIRD_APP_ID=E30F2BDE-F34E-464F-9689-7D5C443231A3
   SENDBIRD_API_TOKEN=25425a601e47017a00b63cef73915a5488f94cd4

   # Sendbird Calls (NEW - for video calling)
   NEXT_PUBLIC_SENDBIRD_CALLS_APP_ID=your-calls-app-id-here
   ```

5. **Restart Your Dev Server**
   ```bash
   npm run dev
   ```

### Option 2: Use Free Alternative (Jitsi Meet - Already Tested)

If you prefer a **100% free** solution without creating another Sendbird app:

1. **Restore Jitsi Implementation** (I can do this for you)
   - No API keys needed
   - No sign-up required
   - Unlimited meetings
   - Works in browser directly

2. **Pros:**
   - ✅ Completely free
   - ✅ No setup required
   - ✅ HIPAA-compliant infrastructure available
   - ✅ Open-source

3. **Cons:**
   - ❌ Less control over branding
   - ❌ Hosted on Jitsi servers (not your infrastructure)

## 💰 Pricing Comparison

### Sendbird Calls
- **Free Tier:** Not available for Calls (unlike Chat)
- **Pricing:** Pay-as-you-go based on minutes
- **Production:** Requires payment method even for testing

### Jitsi Meet
- **Free Tier:** Unlimited (100% free forever)
- **Self-hosting:** Optional (can host on your own servers)
- **Production:** Free to use

## 🚀 Recommendation

**For Development/Testing:**
- Use **Jitsi Meet** (free, no setup)

**For Production (if budget allows):**
- Use **Sendbird Calls** (more control, better integration with existing Sendbird Chat)

## 🔧 What's Currently Installed

✅ `sendbird-calls` npm package (installed)
✅ Video calling UI component (ready)
❌ Sendbird Calls App ID (not configured)

## 📞 Next Steps

**Choose ONE:**

1. **Go with Jitsi (Free)** → Let me know, I'll restore it
2. **Set up Sendbird Calls** → Create app, add App ID to `.env.local`, restart server
3. **Try another solution** → Daily.co, Twilio, Agora, etc.

## ❓ Questions?

- Which option do you prefer?
- Do you have budget for Sendbird Calls?
- Should I restore the Jitsi implementation?
