import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

export async function POST(request) {
  try {
    const { to, subject, body } = await request.json();

    // Configure SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: to,
      from: 'safespace.dev.app@gmail.com', // Use a verified sender email in your SendGrid account
      subject: subject,
      text: body,
      html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
    };

    // Send the email
    await sgMail.send(msg);

    console.log('Email sent successfully to:', to);

    return NextResponse.json({
      message: 'Email sent successfully',
    });

  } catch (error) {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error(error.response.body)
    }
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}