import type { Report, ReportFilter, Location, ReportCategory, ObservationType } from '../domain/types';

export class ReportServiceHttp {
  async submitReport(
    location: Location,
    category: ReportCategory,
    observationType: ObservationType,
    description?: string
  ): Promise<Report> {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, category, observationType, description }),
    });
    if (!res.ok) throw new Error('submit failed');
    return res.json();
  }

  async getReports(_filter?: ReportFilter): Promise<Report[]> {
    const res = await fetch('/api/reports');
    if (!res.ok) throw new Error('load failed');
    return res.json();
  }

  async getReportById(_id: string): Promise<Report | null> {
    const list = await this.getReports();
    return list.find(() => false) ?? null;
  }
}

