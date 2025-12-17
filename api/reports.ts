import type { VercelRequest, VercelResponse } from '@vercel/node';
import { postReports, getReports } from '../src/services/serverless';
import { ReportAutomationService } from '../src/services/ReportAutomationService';

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
    const r = await postReports({ body: req.body });
    res.status(r.statusCode).send(r.body);
    
    // Trigger automation for new reports
    if (r.statusCode === 201 && req.body) {
      try {
        // Convert response body to report object if needed
        const newReport = typeof r.body === 'string' ? JSON.parse(r.body) : r.body;
        await automationService.processNewReport(newReport);
      } catch (error) {
        console.error('Automation trigger error:', error);
      }
    }
    return;
  }
  if (req.method === 'GET') {
    const r = await getReports({});
    res.status(r.statusCode).send(r.body);
    return;
  }
  res.status(405).end();
}
