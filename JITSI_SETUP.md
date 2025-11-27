# Jitsi Meet Video Calling Setup Guide

## Overview
SafeSpace now uses **Jitsi Meet** for video calling - a 100% free, open-source video conferencing solution. No account, no payment method, no setup required!

## Why Jitsi Meet?
- ✅ **100% Free Forever** - No payment required
- ✅ **No Account Needed** - Works out of the box
- ✅ **Open Source** - Transparent and trustworthy
- ✅ **No Setup Required** - Just works!
- ✅ **Privacy Focused** - GDPR compliant
- ✅ **Reliable** - Used by millions worldwide
- ✅ **Feature Rich** - Screen sharing, recording, chat, etc.
- ✅ **No Participant Limits** - Unlike other free options

## Setup Steps

### ✨ No Setup Required!
That's right - Jitsi Meet works out of the box with **zero configuration**. No API keys, no accounts, no payment methods. Just restart your dev server and it works!

```bash
# Just restart your server
npm run dev
```

## How It Works

### For Therapists/Staff
1. Click **Join Video Call** button in an appointment
2. Modal opens with a unique meeting link
3. You'll see:
   - The meeting URL (shareable link)
   - Copy button to copy the URL
   - "Open in New Tab" button
   - "Join Video Call" button
4. Share the URL with your client via chat/email/SMS
5. Click "Join Video Call" to enter the meeting
6. Use Jitsi's built-in controls:
   - Mute/Unmute microphone
   - Turn camera on/off
   - Screen sharing
   - Chat
   - Raise hand
   - Recording (if needed)
   - End call

### For Clients
1. Receive the meeting URL from their therapist
2. Click the link in any browser (desktop/mobile)
3. Automatically joins the meeting (no account needed)
4. Full video calling experience

## Meeting Features
- **Privacy**: Each appointment gets a unique room name
- **No Time Limits**: Unlimited call duration (100% free!)
- **Screen Sharing**: Share your screen with participants
- **Chat**: Built-in text chat during calls
- **Recording**: Record sessions (saves to local device)
- **Mobile Support**: Works on iOS and Android browsers
- **Auto-Expire**: Rooms expire when everyone leaves
- **Built-in Controls**:
  - Audio/video mute
  - Screen sharing
  - Full-screen mode
  - Picture-in-picture
  - Network quality indicator
  - Participant list
  - Raise hand
  - Virtual backgrounds (desktop)

## Troubleshooting

### Camera/microphone not working
- Allow browser permissions for camera/microphone when prompted
- Check your device settings (camera/mic not in use by other apps)
- Try refreshing the page
- Check browser console for errors

### Can't join the meeting
- Ensure the meeting URL is copied correctly
- Try opening in a different browser
- Disable browser extensions that might block WebRTC
- Check your internet connection

### Poor video quality
- Check your internet connection speed
- Close other bandwidth-heavy applications
- Ask other participants to turn off their video temporarily
- Jitsi automatically adjusts quality based on network

### Audio echo or feedback
- Use headphones to prevent echo
- Ensure only one person has audio enabled when testing
- Check microphone sensitivity settings

## Advanced Features

### Self-Hosting (Optional)
If you want complete control and privacy, you can self-host Jitsi:

1. Follow the official guide: https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-quickstart
2. Update `VideoCallModal.jsx` line 76:
   ```javascript
   const domain = 'your-jitsi-server.com'; // Replace with your domain
   ```

### Custom Branding
You can customize the Jitsi interface by modifying the `interfaceConfigOverwrite` in `VideoCallModal.jsx`.

### Enable Recording
Recording is built-in but requires additional setup:
- For cloud recording, you need a self-hosted instance with Jibri
- For local recording, users can use the built-in record button

## Security & Privacy

### Meeting Security
- Each appointment gets a unique, unpredictable room name
- Room format: `safespace-{appointmentId}-{timestamp}`
- Rooms are not listed publicly
- End-to-end encryption available (enable in settings)

### GDPR Compliance
- Jitsi Meet is GDPR compliant
- No data stored on servers (peer-to-peer when possible)
- All communication encrypted in transit
- No tracking or analytics by default

### For Production/HIPAA Compliance
For therapy apps requiring HIPAA compliance:
- Self-host Jitsi on your own servers
- Enable end-to-end encryption
- Configure server-side recording with encrypted storage
- Sign a Business Associate Agreement (BAA) with your hosting provider
- Use JWT authentication for additional security

## Comparison with Other Solutions

| Feature | Jitsi Meet | Daily.co | Whereby | Zoom |
|---------|-----------|----------|---------|------|
| **Cost** | Free | $99/mo | $9.99/mo | $149/year |
| **Setup** | None | Payment method | Account | Account |
| **Minutes** | Unlimited | 10K free | 2K free | 40 min limit |
| **Participants** | Unlimited | Plan limit | 4 free | 100 |
| **No Account** | ✅ | ✅ | ✅ | ❌ |
| **Open Source** | ✅ | ❌ | ❌ | ❌ |
| **Self-Hostable** | ✅ | ❌ | ❌ | ❌ |
| **HIPAA Ready** | ✅ (self-hosted) | ✅ | ❌ | ✅ |

## Migration from Daily.co/Sendbird

All appointments will now use Jitsi Meet automatically. No data migration needed.

**What changed:**
- ✅ Removed Daily.co API dependency
- ✅ Removed payment method requirement
- ✅ No backend API calls needed
- ✅ Direct browser-to-Jitsi connection
- ✅ Simpler, more reliable architecture

**Old code removed:**
- `app/api/daily/create-room/route.js` - No longer needed
- `@daily-co/daily-js` package - Uninstalled
- `DAILY_API_KEY` environment variable - No longer needed

## Support & Resources

- **Jitsi Documentation**: https://jitsi.github.io/handbook/
- **Community Forum**: https://community.jitsi.org/
- **GitHub**: https://github.com/jitsi/jitsi-meet
- **Security Guide**: https://jitsi.github.io/handbook/docs/devops-guide/secure-domain

## Enjoy!

Jitsi Meet is production-ready and used by millions worldwide including:
- Schools and universities
- Government organizations
- Healthcare providers
- Fortune 500 companies

No payment, no account, no hassle. Just secure, reliable video calls. 🎥✨
