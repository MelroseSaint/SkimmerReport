import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ReportAutomationService } from '../src/services/ReportAutomationService.js';


function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const automationService = new ReportAutomationService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      // Trigger daily summary manually
      await automationService.sendDailySummary();

      res.status(200).json({
        success: true,
        message: 'Daily summary triggered successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Daily summary trigger error:', error);
      res.status(500).json({
        error: 'Failed to trigger daily summary',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}