import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { base64Data, mimeType } = await request.json();

    if (!base64Data || !mimeType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const modelName = "gemini-1.5-flash";
    
    // v1beta supports multimodal (vision/PDF)
    let url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    console.log('Calling Gemini API:', modelName);
    
    const requestBody = {
      contents: [{
        parts: [
          {
            text: `Extract all information from this referral form and return ONLY a valid JSON object with these exact field names (use empty string "" for missing fields):
{
  "client_first_name": "",
  "client_last_name": "",
  "age": "",
  "gender": "",
  "phone": "",
  "secondary_phone": "",
  "address": "",
  "email": "",
  "emergency_first_name": "",
  "emergency_last_name": "",
  "emergency_phone": "",
  "preferred_contact_method": "",
  "preferred_language": "",
  "pronouns": "",
  "availability_notes": "",
  "referring_provider_name": "",
  "referring_provider_phone": "",
  "referring_provider_email": "",
  "relationship_to_client": "",
  "consent_date": "",
  "referral_source": "",
  "reason_for_referral": "",
  "additional_notes": ""
}

Extract dates in YYYY-MM-DD format. For gender use: Male, Female, or Other. For preferred_contact_method use: phone, email, or sms. For referral_source try to match: "Forensic Psychiatric center", "Out patient Service", "Mental Health Rehabilitation Program", "Mental Health And Addiction Center", or "Other". Return ONLY the JSON, no other text.`
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }]
      };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      return NextResponse.json(
        { 
          error: `Gemini API error: ${response.status}`,
          details: errorText,
          suggestion: response.status === 404 
            ? 'API key may not have Generative Language API enabled. Visit https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com'
            : response.status === 429
            ? 'Rate limit exceeded. Please wait a moment.'
            : 'Unknown error occurred.'
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    const extractedText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse the JSON response
    const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extractedData = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ data: extractedData });
    }

    return NextResponse.json(
      { error: 'Could not extract JSON from response', rawText: extractedText },
      { status: 500 }
    );

  } catch (error) {
    console.error('Extract referral error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process document' },
      { status: 500 }
    );
  }
}
