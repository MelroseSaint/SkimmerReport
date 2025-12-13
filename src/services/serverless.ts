import type { ReportFilter } from '../domain/types';
import { InMemoryReportRepository } from '../infrastructure/InMemoryReportRepository';
import { ReportService } from './ReportService';

const repo = new InMemoryReportRepository();
const service = new ReportService(repo);

// Minimal request/response shapes to emulate serverless handlers
export async function postReports(event: { body: any }) {
  const { location, category, observationType, description } = event.body || {};
  if (!location || !category || !observationType) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }
  const report = await service.submitReport(location, category, observationType, description);
  return { statusCode: 201, body: JSON.stringify(report) };
}

export async function getReports(_event: { query?: ReportFilter }) {
  const reports = await service.getReports(_event.query);
  return { statusCode: 200, body: JSON.stringify(reports) };
}
