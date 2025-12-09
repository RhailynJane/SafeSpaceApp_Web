export async function summarizeConversation(transcript) {
  if (!transcript || transcript.trim().length === 0) {
    throw new Error('No transcript to summarize');
  }

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment.');
  }

  const prompt = `You are a mental health conversation assistant. Analyze the following conversation transcript and provide:

1. **Conversation Summary**: A brief 2-3 sentence summary of the main topics discussed.

2. **Key Themes**: List 3-5 key emotional or mental health themes identified in the conversation.

3. **Recommendations**: 3-5 specific, actionable recommendations for the user based on what was discussed. Focus on mental health, wellness, and coping strategies.

4. **Resources**: Suggest 2-3 types of resources or support (e.g., meditation apps, therapy, self-help books) that might be helpful.

5. **Positive Notes**: Highlight 1-2 positive aspects or strengths shown during the conversation.

Format your response as JSON with these exact keys:
{
  "summary": "...",
  "themes": ["...", "...", "..."],
  "recommendations": ["...", "...", "..."],
  "resources": ["...", "...", "..."],
  "positiveNotes": ["...", "..."]
}

CONVERSATION TRANSCRIPT:
${transcript}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Gemini API error:', error);
      throw new Error(`Failed to summarize conversation: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from Gemini API');
    }

    // Extract JSON from the response (handle markdown code blocks)
    let jsonString = aiResponse;
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      jsonString = jsonMatch[1] || jsonMatch[0];
    }

    const summary = JSON.parse(jsonString);
    console.log('✅ Conversation summary generated:', summary);
    
    return summary;
  } catch (error) {
    console.error('❌ Error summarizing conversation:', error);
    throw error;
  }
}
