import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { EmailNotificationData } from '../src/domain/automation';

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  if (req.method === 'POST') {
    try {
      const emailData: EmailNotificationData = req.body;
      
      // Validate email data
      if (!emailData.to || !emailData.subject || !emailData.body) {
        return res.status(400).json({ error: 'Missing required email fields' });
      }
      
      // In production, you would use an email service like:
      // - Vercel Email API
      // - SendGrid
      // - AWS SES
      // - Resend
      
      // For now, log the email (replace with actual email service)
      console.log('Email would be sent:', {
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        timestamp: new Date().toISOString()
      });
      
      // Example using Vercel Email API (uncomment if you have it configured):
      /*
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'noreply@skimmer-report.vercel.app',
          to: [emailData.to],
          subject: emailData.subject,
          text: emailData.body,
        }),
      });
      */
      
      res.status(200).json({ 
        success: true, 
        message: 'Email processed successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Email send error:', error);
      res.status(500).json({ 
        error: 'Failed to send email',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    return;
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}