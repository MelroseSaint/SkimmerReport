import type { Report, ReportFilter } from '../domain/types';
import { evaluateReportsAtLocation } from '../domain/confirmation';
import type { ReportRepository } from '../domain/ReportRepository';

export class InMemoryReportRepository implements ReportRepository {
    private reports: Report[] = [];

    constructor() {
        // Seed with some dummy data for visualization
        this.seedData();
    }

    private seedData() {
        this.reports.push(
            {
                id: '1',
                location: { latitude: 40.7128, longitude: -74.0060 }, // NYC
                category: 'ATM',
                observationType: 'Loose card slot',
                description: 'Card reader felt wiggly at the bodega ATM.',
                timestamp: new Date().toISOString(),
            },
            {
                id: '2',
                location: { latitude: 40.7300, longitude: -73.9950 }, // NYC
                category: 'Gas pump',
                observationType: 'Overlay',
                description: 'Weird plastic piece on the card insert.',
                timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            }
        );
    }

    async save(reportData: Omit<Report, 'id' | 'timestamp'>): Promise<Report> {
        const newReport: Report = {
            ...reportData,
            id: Math.random().toString(36).substr(2, 9),
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

    async getById(id: string): Promise<Report | null> {
        const report = this.reports.find(r => r.id === id);
        return report || null;
    }
}
