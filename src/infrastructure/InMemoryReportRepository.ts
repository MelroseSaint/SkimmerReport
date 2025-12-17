import type { Report, ReportFilter } from '../domain/types';
import { evaluateReportsAtLocation } from '../domain/confirmation';
import type { ReportRepository } from '../domain/ReportRepository';

export class InMemoryReportRepository implements ReportRepository {
    private reports: Report[] = [];

    constructor() {}

    async save(reportData: Omit<Report, 'id' | 'timestamp'>): Promise<Report> {
        const newReport: Report = {
            ...reportData,
            id: Math.random().toString(36).substring(2, 11),
            report_id: Math.random().toString(36).substring(2, 11),
            merchant: reportData.merchant || 'Unknown',
            timestamp: new Date().toISOString(),
            status: 'Under Review',
            confidenceScore: 0,
        };
        this.reports.push(newReport);
        const evalRes = evaluateReportsAtLocation(this.reports, newReport.location);
        // Apply idempotent updates across this location
        const key = ((loc: { latitude: number; longitude: number; }) => {
          const r = (n: number) => Math.round(n * 10000) / 10000;
          return `${r(loc.latitude)},${r(loc.longitude)}`;
        })(newReport.location);
        this.reports = this.reports.map(r => {
          const rk = ((loc: { latitude: number; longitude: number; }) => {
            const rr = (n: number) => Math.round(n * 10000) / 10000;
            return `${rr(loc.latitude)},${rr(loc.longitude)}`;
          })(r.location);
          if (rk !== key) return r;
          const next: Report = { ...r, confidenceScore: evalRes.score, lastEvaluatedAt: evalRes.evaluatedAt };
          if (r.status !== 'Confirmed' && evalRes.confirm) {
            next.status = 'Confirmed';
            next.confirmationReason = evalRes.reason;
          }
          return next;
        });
        return this.reports.find(rr => rr.id === newReport.id)!;
    }

    async getAll(_filter?: ReportFilter): Promise<Report[]> {
        // Basic filtering logic can be added here
        return this.reports;
    }

    async getReports(filter?: ReportFilter): Promise<Report[]> {
        if (!filter) return this.reports;
        
        return this.reports.filter(report => {
            if (filter.minTimestamp && new Date(report.timestamp) < new Date(filter.minTimestamp)) {
                return false;
            }
            if (filter.category && report.category !== filter.category) {
                return false;
            }
            if (filter.center && filter.radius) {
                const distance = this.calculateDistance(
                    report.location, 
                    filter.center
                );
                if (distance > filter.radius) {
                    return false;
                }
            }
            return true;
        });
    }

    async getById(id: string): Promise<Report | null> {
        const report = this.reports.find(r => r.id === id);
        return report || null;
    }

    async updateReport(id: string, updates: Partial<Report>): Promise<Report | null> {
        const index = this.reports.findIndex(r => r.id === id || r.report_id === id);
        if (index === -1) return null;
        
        this.reports[index] = { ...this.reports[index], ...updates };
        return this.reports[index];
    }

    private calculateDistance(loc1: { latitude: number; longitude: number }, loc2: { latitude: number; longitude: number }): number {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = loc1.latitude * Math.PI/180;
        const φ2 = loc2.latitude * Math.PI/180;
        const Δφ = (loc2.latitude - loc1.latitude) * Math.PI/180;
        const Δλ = (loc2.longitude - loc1.longitude) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // Distance in meters
    }
}
