import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { EmailNotificationData } from '../src/domain/automation.js';
import { setSecurityHeaders, rateLimiter, detectSuspiciousRequest, getClientIp, sanitizeText } from '../src/security/validation.js';


function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
}

// Allowed email recipients for security
const ALLOWED_RECIPIENTS = [
  'monroedoses@gmail.com',
  'no-reply@skimmer-report.vercel.app'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apply security headers
  setSecurityHeaders(res);
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Detect suspicious requests
  const suspicious = detectSuspiciousRequest(req as any);

  if (suspicious.isSuspicious) {
    console.warn('Suspicious email request detected:', {
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'],
      reasons: suspicious.reasons
    });
    return res.status(429).json({
      error: 'Request blocked for security reasons',
      reasons: suspicious.reasons
    });
  }

  // Apply rate limiting
  const clientIp = getClientIp(req);
  if (!rateLimiter.isAllowed(clientIp)) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      remaining: rateLimiter.getRemainingRequests(clientIp),
      retryAfter: 3600
    });
  }

  if (req.method === 'POST') {
    try {
      const emailData: EmailNotificationData = req.body;

      // Validate required fields
      if (!emailData.to || !emailData.subject || !emailData.body) {
        return res.status(400).json({ error: 'Missing required email fields' });
      }

      // Validate email recipient (prevent email injection)
      if (!ALLOWED_RECIPIENTS.includes(emailData.to.toLowerCase())) {
        console.warn('Unauthorized email recipient attempted:', {
          to: emailData.to,
          ip: getClientIp(req)
        });
        return res.status(403).json({ error: 'Unauthorized email recipient' });
      }

      // Validate and sanitize email content
      const sanitizedSubject = sanitizeText(emailData.subject, 100);
      const sanitizedBody = sanitizeText(emailData.body, 2000);

      // Check for potential email injection attacks
      const injectionPatterns = [
        /content-transfer-encoding:/i,
        /content-type:/i,
        /mime-version:/i,
        /bcc:/i,
        /cc:/i,
        /to:/i,
        /from:/i,
        /subject:/i,
        /reply-to:/i,
        /return-path:/i,
        /x-/
      ];

      const bodyHasInjection = injectionPatterns.some(pattern =>
        pattern.test(sanitizedBody) || pattern.test(sanitizedSubject)
      );

      if (bodyHasInjection) {
        console.warn('Email injection attempt detected:', {
          subject: sanitizedSubject,
          ip: getClientIp(req)
        });
        return res.status(400).json({ error: 'Invalid email content detected' });
      }

      // Log email for audit trail
      console.log('Email processed:', {
        to: emailData.to,
        subject: sanitizedSubject,
        bodyLength: sanitizedBody.length,
        timestamp: new Date().toISOString(),
        ip: getClientIp(req)
      });

      // In production, use actual email service
      // Example using Vercel Email API:
      /*
      if (process.env.RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: emailData.from || 'noreply@skimmer-report.vercel.app',
            to: [emailData.to],
            subject: sanitizedSubject,
            text: sanitizedBody,
          }),
        });
      }
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
        message: 'Internal server error'
      });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}