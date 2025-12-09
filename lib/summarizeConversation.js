export async function summarizeConversation(transcript) {
  if (!transcript || transcript.trim().length === 0) {
    throw new Error('No transcript to analyze');
  }

  try {
    // Call the backend API endpoint instead of Gemini directly
    const response = await fetch('/api/gemini/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.status}`);
    }

    const assessment = await response.json();
    console.log('✅ Mental health assessment generated:', assessment);
    return assessment;
  } catch (error) {
    console.error('❌ Error analyzing conversation:', error);
    throw error;
  }
}
