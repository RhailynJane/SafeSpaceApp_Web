# Daily.co Video Calling Setup Guide

## Overview
SafeSpace now uses **Daily.co** for video calling, replacing Sendbird. Daily.co is specifically designed for healthcare and therapy applications with HIPAA compliance built-in.

## Why Daily.co?
- ✅ **HIPAA Compliant** - Perfect for therapy/healthcare sessions
- ✅ **10,000 Free Minutes/Month** - Generous free tier
- ✅ **No Participant Accounts Required** - Clients join via simple URL
- ✅ **Reliable Infrastructure** - No DNS/network errors
- ✅ **Built-in Recording** (optional, paid feature)
- ✅ **Simple API** - Easy to integrate and maintain

## Setup Steps

### 1. Create a Daily.co Account
1. Go to [https://dashboard.daily.co/signup](https://dashboard.daily.co/signup)
2. Sign up with your email (free account)
3. Verify your email address

### 2. Get Your API Key
1. Log in to [Daily.co Dashboard](https://dashboard.daily.co/)
2. Navigate to **Developers** section in the sidebar
3. Click on **API Keys**
4. Copy your API key (starts with a long string)
   - If you don't see one, click "Create API Key"

### 3. Add Payment Method (Required)
**Important**: Daily.co requires a payment method on file, even for free tier usage.

1. Go to [Daily.co Billing](https://dashboard.daily.co/billing)
2. Click **Add Payment Method**
3. Enter your credit/debit card information
4. Save the payment method

**Note**: You won't be charged unless you exceed the free tier (10,000 minutes/month). This is just for account verification.

**Error if skipped**: `account-missing-payment-method` - Video calls won't work without this step!

### 4. Configure Environment Variable
1. Open `.env.local` in your SafeSpace project
2. Find the line:
   ```
   DAILY_API_KEY=your_daily_api_key_here
   ```
3. Replace `your_daily_api_key_here` with your actual Daily.co API key
4. Save the file

Example:
```env
DAILY_API_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### 5. Restart Your Development Server
```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

## How It Works

### For Therapists/Staff
1. Click **Join Video Call** button in an appointment
2. Modal opens with "Creating room..." message
3. Once ready, you'll see:
   - The room URL (shareable link)
   - Copy button to copy the URL
   - "Join Call" button
4. Share the URL with your client via chat/email/SMS
5. Click "Join Call" to enter the video room
6. Use controls: Mute, Video On/Off, End Call

### For Clients
1. Receive the room URL from their therapist
2. Click the link in browser (works on desktop/mobile)
3. Automatically joins the call (no account needed)
4. Full video calling experience

## Room Features
- **Privacy**: Rooms are private by default (URL required to join)
- **Auto-Expiration**: Rooms automatically expire 24 hours after creation
- **Max Participants**: Limited to appointment participants only
- **Built-in Features**:
  - Screen sharing
  - Text chat
  - Full-screen mode
  - Picture-in-picture
  - Network quality indicator

## Troubleshooting

### "account-missing-payment-method"
**This is the most common error!**
- Daily.co requires a payment method on file, even for free tier
- Go to: https://dashboard.daily.co/billing
- Add a credit/debit card (you won't be charged for free tier usage)
- This is just for account verification
- Retry the video call after adding payment method

### "Video call feature is not configured"
- Check that `DAILY_API_KEY` is set in `.env.local`
- Restart your dev server after adding the key
- Verify the key is correct (no extra spaces)

### Room creation fails
- Check your Daily.co dashboard for API key status
- Ensure you haven't exceeded free tier limits (10K minutes/month)
- Check browser console for specific error messages

### Video/audio not working
- Allow browser permissions for camera/microphone
- Check your device settings (camera/mic not in use by other apps)
- Try refreshing the page
- Check network connection (Daily.co requires WebRTC)

### Can't join the call
- Ensure the room URL is copied correctly
- Check that the room hasn't expired (24 hours max)
- Try opening in incognito/private window
- Disable browser extensions that might block WebRTC

## Advanced Configuration

### Enable Recording (Paid Feature)
Edit `app/api/daily/create-room/route.js`:
```javascript
properties: {
  // ... other properties
  enable_recording: 'cloud', // Uncomment this line
}
```

### Extend Room Duration
Change the `exp` value in `app/api/daily/create-room/route.js`:
```javascript
// Current: 24 hours (86400 seconds)
exp: Math.floor(Date.now() / 1000) + 86400,

// For 48 hours:
exp: Math.floor(Date.now() / 1000) + 172800,
```

### Custom Room Names
Modify the `name` field in `app/api/daily/create-room/route.js`:
```javascript
name: `safespace-${appointmentId}`, // Custom format
```

## API Limits (Free Tier)
- **10,000 minutes/month** - About 166 hours
- **100 rooms/month** - Room creation limit
- **20 participants/room** - Max concurrent users per room

Upgrade to paid plan for:
- Unlimited minutes
- Recording features
- Custom branding
- HIPAA Business Associate Agreement (BAA)

## Security Notes
- Rooms are private by default (URL required)
- URLs are unique and unpredictable
- Rooms auto-expire after 24 hours
- No data stored on Daily.co servers (unless recording enabled)
- For production HIPAA compliance, sign a BAA with Daily.co (requires paid plan)

## Migration from Sendbird
All appointments will now use Daily.co automatically. No data migration needed.

Old Sendbird environment variables can be removed (keep them if chat is still using Sendbird):
- ~~NEXT_PUBLIC_SENDBIRD_APP_ID~~ (video calling only)
- Video calling features fully replaced

## Support
- **Daily.co Docs**: [https://docs.daily.co/](https://docs.daily.co/)
- **Dashboard**: [https://dashboard.daily.co/](https://dashboard.daily.co/)
- **Support**: [https://www.daily.co/contact](https://www.daily.co/contact)
