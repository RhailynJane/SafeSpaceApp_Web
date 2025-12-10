# Speech-to-Text Audio Detection Troubleshooting

## Quick Diagnostics

If speech is not being detected, follow these steps:

### Step 1: Check Browser Support
Open browser console (F12 → Console) and look for these messages:

✅ **Expected**: `🎙️ Speech recognition started` when you click record
❌ **Problem**: `❌ Web Speech API not supported in this browser`

**Supported Browsers:**
- ✅ Chrome/Chromium (v25+)
- ✅ Safari (v14.1+)
- ✅ Edge (v79+)
- ✅ Opera
- ❌ Firefox (not supported - use different browser)

### Step 2: Check Microphone Permission

Look in console for these messages:

**If you see:**
```
❌ Speech recognition error: not-allowed
```

**Solution:**
1. Click 🔒 lock icon in address bar (left side)
2. Find "Microphone" setting
3. Change from "Block" to "Allow" or "Ask"
4. Reload page (Ctrl+R or Cmd+R)
5. Try recording again

### Step 3: Check Microphone Hardware

**In browser console, you should see:**

When starting recording:
```
🎤 Starting speech recognition...
🎙️ Speech recognition started
```

When speaking:
```
📊 Speech recognition onresult event: {resultIndex: 0, resultsLength: 1, isFinal: false}
📝 Segment 0: {text: "hello", confidence: 0.95, isFinal: false}
```

When stopping:
```
⏹️ Stopping speech recognition...
🎙️ Speech recognition ended
```

**Common Hardware Issues:**

| Error | Cause | Solution |
|-------|-------|----------|
| `audio-capture` | No microphone detected | Plug in USB mic or check device settings |
| `no-speech` | Microphone heard silence | Speak louder or closer to mic |
| `network` | No internet connection | Check your WiFi/ethernet |

### Step 4: System-Level Microphone Check

**Windows:**
1. Go to Settings → Privacy & Security → Microphone
2. Ensure "Microphone access" is ON
3. Scroll to "App permissions"
4. Ensure your browser (Chrome/Safari/Edge) has microphone access enabled

**Mac:**
1. Go to System Preferences → Security & Privacy → Microphone
2. Check your browser is in the list
3. If not listed, click + and add it

**Linux:**
1. Open ALSA mixer: `alsamixer`
2. Check "Capture" levels are not muted (shows MM = muted)
3. Adjust levels with arrow keys

### Step 5: Test Microphone Before Recording

**In browser console, run:**
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Microphone access granted');
    stream.getTracks().forEach(t => t.stop());
  })
  .catch(err => {
    console.error('❌ Microphone access denied:', err.message);
  });
```

**Expected result:**
```
✅ Microphone access granted
```

**If you see error, it's a permissions issue - follow Step 2 above.**

## Detailed Browser Console Messages

### During Recording

**What you should see:**
```
🎤 Starting speech recognition...
🎙️ Speech recognition started
📊 Speech recognition onresult event: {resultIndex: 0, resultsLength: 1, isFinal: false}
📝 Segment 0: {text: "I'm feeling...", confidence: 0.87, isFinal: false}
✅ Transcript updated: I'm feeling... 
🔤 Interim text: anxious
```

**Word counter should increase** as you speak.

### Common Error Messages

#### 1. "Web Speech API not supported in this browser"
```javascript
// Means you're using Firefox or older browser
// Solution: Use Chrome, Safari, or Edge
```

#### 2. "Microphone permission denied"
```javascript
// not-allowed error
// Solution: Allow microphone in browser settings (see Step 2)
```

#### 3. "No microphone found"
```javascript
// audio-capture error
// Solution: Check system microphone is working
// Test with another app (Zoom, Discord, Skype)
```

#### 4. "No speech detected"
```javascript
// no-speech error
// Solution: 
// • Speak louder
// • Speak closer to microphone
// • Ensure microphone is not muted
// • Try speaking again after 1 second pause
```

## Debug Mode

Add this to VideoCallModal.jsx to enable detailed logging:

```javascript
useEffect(() => {
  if (isRecording) {
    console.log('📊 Recording State:', {
      isRecording,
      isListening,
      isSpeechSupported,
      speechError,
      transcriptLength: finalTranscript.length,
      transcript: finalTranscript.substring(0, 100) + '...'
    });
  }
}, [isRecording, isListening, isSpeechSupported, speechError, finalTranscript]);
```

## Step-by-Step Testing

### Test 1: Browser Support
1. Open DevTools (F12)
2. Go to Console tab
3. See if error message about API support appears
4. **✅ If green messages appear, browser is supported**

### Test 2: Permissions
1. Click Record button
2. Browser should ask for microphone permission
3. Choose "Allow"
4. **✅ If recording starts, permissions granted**

### Test 3: Microphone Detection
1. During recording, speak: "Hello, this is a test"
2. Check console for `📝 Segment` messages with your text
3. **✅ If you see your words in console, microphone is working**

### Test 4: Transcript Accumulation
1. Record for 10 seconds while speaking naturally
2. Stop recording
3. Check word counter shows ~10-20 words
4. **✅ If transcript appears, audio is being captured**

## Advanced Debugging

### Enable WebAudio Logging
```javascript
// In browser console:
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
console.log('Audio Context State:', audioContext.state); // should be 'running'
```

### Check Media Permissions
```javascript
// In browser console:
navigator.permissions.query({name: 'microphone'}).then(result => {
  console.log('Microphone permission:', result.state);
  // 'granted', 'denied', or 'prompt'
});
```

### Monitor Recognition Events
```javascript
// Add to useSpeechRecognition.js for extra logging:
recognition.onaudiostart = () => console.log('🎵 Audio started');
recognition.onaudioend = () => console.log('🎵 Audio ended');
recognition.onsoundstart = () => console.log('🔊 Sound detected');
recognition.onsoundend = () => console.log('🔇 Sound ended');
```

## Still Not Working?

Try these final solutions:

1. **Restart Browser** - Close all tabs and reopen
2. **Clear Cookies** - Settings → Privacy → Clear Cookies for this site
3. **Test in Incognito Mode** - Ctrl+Shift+N (Chrome) - checks for extension conflicts
4. **Try Different Browser** - Chrome vs Safari vs Edge
5. **Test External Microphone** - If using laptop mic, try USB headset
6. **Check System Volume** - Windows/Mac volume should not be muted
7. **Disable VPN** - Some VPNs block audio access
8. **Check Firewall** - Some firewalls block Web Audio API

## Contact Support

If still not working, provide this info:
- Browser + version (Chrome 120, Safari 17, etc.)
- Operating system + version
- Microphone type (built-in, USB, headset)
- Console errors (copy full error messages)
- Screenshot of permission dialog
