import type { Report, ReportFilter, Location, ReportCategory, ObservationType } from '../domain/types';

export interface ReportServiceLike {
  submitReport(
    location: Location,
    category: ReportCategory,
    observationType: ObservationType,
    description?: string
  ): Promise<Report>;
  getReports(filter?: ReportFilter): Promise<Report[]>;
}

export class ReportServiceHybrid implements ReportServiceLike {
  private primary: ReportServiceLike;
  private fallback: ReportServiceLike;
  constructor(primary: ReportServiceLike, fallback: ReportServiceLike) {
    this.primary = primary;
    this.fallback = fallback;
  }

  async submitReport(
    location: Location,
    category: ReportCategory,
    observationType: ObservationType,
    description?: string
  ): Promise<Report> {
    try {
      return await this.primary.submitReport(location, category, observationType, description);
    } catch {
      return await this.fallback.submitReport(location, category, observationType, description);
    }
  }

  async getReports(filter?: ReportFilter): Promise<Report[]> {
    try {
      return await this.primary.getReports(filter);
    } catch {
      return await this.fallback.getReports(filter);
    }
  }
}
