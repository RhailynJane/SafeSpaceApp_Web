# Speech-to-Text & AI Conversation Summary Feature

## Overview
The video call modal now includes integrated speech-to-text recording with AI-powered conversation analysis. Users can record video calls and receive automatic summaries with personalized recommendations.

## Features

### 1. **Real-Time Speech Recording**
- **Recording Button**: Red pulsing button in the video call controls
- **Live Transcript Counter**: Shows word count as conversation is recorded
- **Browser Compatibility**: Uses Web Speech API (Chrome, Edge, Safari supported)
- **Auto Language**: English (en-US) - configurable in `useSpeechRecognition.js`

### 2. **AI-Powered Analysis**
- **Google Gemini Integration**: Uses `gemini-1.5-flash` model for analysis
- **Automatic Summary**: Triggered after call ends![1765300396862](image/SPEECH_TO_TEXT_FEATURE/1765300396862.png)![1765300400598](image/SPEECH_TO_TEXT_FEATURE/1765300400598.png)![1765300407433](image/SPEECH_TO_TEXT_FEATURE/1765300407433.png)
- **Response Format**: Structured JSON with multiple insights

### 3. **Summary Report Contents**
- **Conversation Summary**: 2-3 sentence overview of main topics
- **Key Themes**: 3-5 emotional/mental health themes identified
- **Recommendations**: 3-5 actionable steps for the user
- **Resources**: Suggested support materials (apps, therapy, books)
- **Positive Notes**: Strengths and positive aspects highlighted

### 4. **PDF Export**
- Download summary as a styled PDF document
- Professional formatting with color-coded sections
- Includes timestamp of generation

## Technical Implementation

### Files Created/Modified

1. **`hooks/useSpeechRecognition.js`** (New)
   - React hook for Web Speech API integration
   - Manages recording state, transcript buffering
   - Handles errors and browser compatibility

2. **`lib/summarizeConversation.js`** (New)
   - Calls Google Gemini API for conversation analysis
   - Parses JSON response from AI
   - Error handling and logging

3. **`components/schedule/ConversationSummaryModal.jsx`** (New)
   - Modal UI for displaying AI-generated summaries
   - Color-coded sections for different insight types
   - PDF download functionality using jsPDF

4. **`components/schedule/VideoCallModal.jsx`** (Modified)
   - Added recording toggle button with visual feedback
   - Integrated transcript state management
   - Added post-call summary flow
   - New states: `showSummary`, `conversationSummary`, `summaryLoading`, `recordedTranscript`

## Usage

### For Users
1. **During Call**: Click the red recording button to start/stop recording
2. **After Call**: Optionally generate AI summary
3. **View Summary**: Review themes, recommendations, and resources
4. **Export**: Download summary as PDF for reference

### For Developers

#### Enable Recording
```jsx
const { finalTranscript, isListening, startListening, stopListening } = useSpeechRecognition();
```

#### Generate Summary
```jsx
const summary = await summarizeConversation(transcript);
// Returns: {
//   summary: string,
//   themes: string[],
//   recommendations: string[],
//   resources: string[],
//   positiveNotes: string[]
// }
```

## Environment Configuration

### Required
- `NEXT_PUBLIC_GEMINI_API_KEY`: Google Gemini API key
  - Get from: https://makersuite.google.com/app/apikey
  - Required for AI summarization feature

## Browser Support

| Browser | Speech-to-Text | Status |
|---------|----------------|--------|
| Chrome  | Yes (native)   | ✅ Full support |
| Edge    | Yes (native)   | ✅ Full support |
| Safari  | Yes (webkit)   | ✅ Full support |
| Firefox | No             | ⚠️ Fallback only |

Firefox users can still use the app but recording won't work. The UI gracefully disables the record button.

## Features Roadmap

- [ ] Multiple language support
- [ ] Real-time transcription display
- [ ] Speaker diarization (who said what)
- [ ] Mood/sentiment tracking over time
- [ ] Integration with user's journal/notes
- [ ] Share summary with therapist
- [ ] Save summaries to conversation history

## Error Handling

### Common Issues

1. **"Gemini API key not configured"**
   - Add `NEXT_PUBLIC_GEMINI_API_KEY` to `.env.local`
   - Restart dev server

2. **"Web Speech API not supported"**
   - Using unsupported browser (e.g., Firefox)
   - Record button won't appear

3. **"Failed to generate summary"**
   - Check API key is valid
   - Verify transcript has minimum content
   - Check Gemini API usage limits

## Performance Notes

- Speech recognition happens in-browser (no server upload)
- Transcript only sent to Gemini after call ends
- Summary generation typically takes 3-5 seconds
- PDF generation instant after summary ready

## Privacy & Data

- Transcripts processed through Google Gemini API
- Review Google's privacy policy: https://policies.google.com/privacy
- Summaries stored locally in component state
- No transcript data saved to database by default
- Users can skip summary generation entirely

## Testing

```javascript
// Test transcript with known content
const testTranscript = "I've been feeling anxious lately. Work has been stressful...";
const summary = await summarizeConversation(testTranscript);
console.log(summary);
```

## Troubleshooting

### Recording not starting
1. Check browser supports Web Speech API
2. Ensure microphone permissions granted
3. Check browser console for errors

### Summary not generating
1. Verify transcript has content (minimum ~20 words)
2. Check network connectivity
3. Verify NEXT_PUBLIC_GEMINI_API_KEY is set
4. Check console for API error messages

### Poor transcription quality
1. Ensure quiet environment
2. Speak clearly and at normal pace
3. Consider using higher-end microphone
4. Close browser noise in background
