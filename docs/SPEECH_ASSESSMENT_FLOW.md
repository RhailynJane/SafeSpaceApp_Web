# Speech-to-Text & Mental Health Assessment - Flow Guide

## User Flow

### Step 1: Start Video Call
```
User opens video call modal
↓
Video call established with Agora
↓
See 4 control buttons: Mute, Camera, Record, Hang Up
```

### Step 2: Recording Conversation
```
User clicks RED RECORDING button (🔴 with pulsing border)
↓
Speech-to-Text starts capturing audio in real-time
↓
Live word counter appears: "Recording conversation... 45 words"
↓
Transcript accumulates as user speaks
```

### Step 3: Stop Recording
```
User clicks RED RECORDING button again to stop
↓
Recording stops
↓
Modal transitions to TRANSCRIPT VIEW
```

### Step 4: Transcript View
```
┌─────────────────────────────────────────┐
│  🎤 Conversation Transcript              │
│                                         │
│  I've been feeling anxious lately.     │
│  Work has been really stressful with   │
│  deadlines piling up. I find it hard   │
│  to focus when there's so much going   │
│  on around me...                       │
│                                         │
│  ┌────────────────────┬────────────────┐│
│  │  Skip Analysis     │ Analyze        ││
│  │                    │ Conversation   ││
│  └────────────────────┴────────────────┘│
└─────────────────────────────────────────┘
```

### Step 5: Generate Assessment
```
User clicks "Analyze Conversation"
↓
Showing: "Analyzing conversation..." (with spinner)
↓
Gemini API processes transcript as a mental health professional
↓
AI generates structured assessment (3-5 seconds)
```

### Step 6: View Mental Health Assessment
```
┌──────────────────────────────────────────────────┐
│  🧠 Mental Health Assessment                      │
├──────────────────────────────────────────────────┤
│                                                   │
│  💙 Professional Assessment                       │
│  Based on our conversation, I can see that you're│
│  experiencing significant work-related anxiety...│
│                                                   │
│  💜 Your Emotional State                          │
│  Feeling overwhelmed and anxious with difficulty │
│  concentrating...                                │
│                                                   │
│  💡 Key Insights                                  │
│  • Work pressure is a major stressor             │
│  • Difficulty with emotional regulation          │
│  • Self-awareness about triggers                 │
│                                                   │
│  ⚠️ Identified Patterns                           │
│  • Anxiety escalates with deadline pressure      │
│  • Difficulty setting boundaries                 │
│  • Avoidance when feeling overwhelmed           │
│                                                   │
│  💚 Recommended Coping Strategies                 │
│  1. Practice daily 10-minute breathing exercises│
│  2. Set specific work hours with breaks         │
│  3. Try grounding technique when anxious        │
│                                                   │
│  📚 Suggested Resources                           │
│  • Calm or Headspace for meditation             │
│  • Cognitive Behavioral Therapy workbooks       │
│  • "The Anxiety and Phobia Workbook" by Arden   │
│                                                   │
│  ✓ Your Strengths                               │
│  • High self-awareness of your emotions         │
│  • Willingness to seek support                  │
│  • Good problem-solving mindset                 │
│                                                   │
│  💝 Remember...                                  │
│  You're taking the right steps by acknowledging │
│  these challenges. With consistent practice of  │
│  these strategies, you'll see improvements...   │
│                                                   │
│  ┌──────────────────┬──────────────────────────┐│
│  │  Copy Text       │ Download PDF │ Close     ││
│  └──────────────────┴──────────────────────────┘│
└──────────────────────────────────────────────────┘
```

## What the AI Does

### Gemini Role
Acts as a **Psychologist + Peer Support Worker** combination:
- Professional assessment of emotional state
- Identification of patterns and triggers
- Evidence-based coping strategies
- Warm, supportive tone
- Actionable next steps
- Recognition of strengths

### Assessment Components

1. **Professional Assessment** - Overview of their mental state
2. **Emotional State** - Current feelings and mood
3. **Key Insights** - Important observations
4. **Identified Patterns** - Recurring themes and behaviors
5. **Coping Strategies** - Practical techniques with explanations
6. **Resources** - Books, apps, therapies to explore
7. **Next Steps** - Concrete actions they can take
8. **Strengths** - Positive aspects to build on
9. **Supportive Message** - Encouraging, empathetic closing

## Export Options

### Copy to Clipboard
- Copies formatted assessment text
- Shareable with therapist/counselor
- Paste into notes or journal

### Download PDF
- Professional formatted document
- Color-coded sections
- Includes timestamp
- Can be printed or archived

## Browser Support

✅ **Full Support**: Chrome, Safari, Edge (Web Speech API)
⚠️ **Limited**: Firefox (no speech recognition, but assessment works)

## Key Features

- **Privacy**: Transcript only processed through Google Gemini
- **Real-time**: Word counter updates as you speak
- **Immediate**: Assessment in 3-5 seconds
- **Portable**: Export as PDF or copy text
- **Supportive**: Tone is warm and non-judgmental
- **Actionable**: Strategies are practical and evidence-based

## Troubleshooting

### Recording not starting?
- Check microphone permissions
- Try a different browser (Chrome/Safari/Edge)
- Check browser console for errors

### Transcript appears empty?
- Ensure you spoke for at least 10+ seconds
- Check microphone is working
- Try again with clearer speech

### Assessment not generating?
- Verify NEXT_PUBLIC_GEMINI_API_KEY is set
- Check internet connection
- Verify transcript has minimum content (~20 words)
- Check browser console for API errors

## Settings to Customize

Edit `useSpeechRecognition.js` to change:
```javascript
recognition.language = 'en-US'; // Change to other languages
recognition.continuous = true; // Keep enabled for ongoing recording
recognition.interimResults = true; // Shows partial results
```

Edit `summarizeConversation.js` to change:
```javascript
// Adjust AI personality/instructions in the prompt
// Change to 'gemini-pro' for older model (faster, less detailed)
// Change to 'gemini-1.5-pro' for more comprehensive analysis
```
