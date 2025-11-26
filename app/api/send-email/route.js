import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { to, subject, body } = await request.json();

    // Configure Brevo (formerly Sendinblue)
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.AUTH_BREVO_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: 'SafeSpace',
          email: 'safespace.dev.app@gmail.com',
        },
        to: [
          {
            email: to,
          },
        ],
        subject: subject,
        textContent: body,
        htmlContent: `<p>${body.replace(/\n/g, "<br>")}</p>`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API error:', errorData);
      throw new Error(`Brevo API error: ${response.status}`);
    }

    console.log('Email sent successfully to:', to);

    return NextResponse.json({
      message: 'Email sent successfully',
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}