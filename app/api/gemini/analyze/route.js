import { auth } from '@clerk/nextjs/server';

export async function POST(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return new Response(JSON.stringify({ error: 'Invalid transcript' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Service not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `You are a professional mental health counselor and peer support worker. Analyze the following conversation transcript and provide a comprehensive mental health assessment.

Conversation Transcript:
"${transcript}"

Provide your assessment in JSON format with the following fields:
{
  "assessment": "Brief professional summary of the conversation",
  "emotionalState": "Description of the person's emotional state",
  "keyInsights": ["Insight 1", "Insight 2", ...],
  "patterns": ["Pattern 1", "Pattern 2", ...],
  "coping_strategies": ["Strategy 1", "Strategy 2", ...],
  "resources": ["Resource 1", "Resource 2", ...],
  "nextSteps": ["Next step 1", "Next step 2", ...],
  "strengths": ["Strength 1", "Strength 2", ...],
  "supportiveMessage": "An encouraging and supportive message"
}

Be empathetic, non-judgmental, and professional. Focus on understanding and support.`;

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
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return new Response(JSON.stringify({ error: 'Failed to analyze conversation' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      return new Response(JSON.stringify({ error: 'No response from Gemini' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const assessment = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Could not parse response' };

    return new Response(JSON.stringify(assessment), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in gemini/analyze:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
