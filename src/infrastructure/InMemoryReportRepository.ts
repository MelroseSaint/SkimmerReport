import type { Report, ReportFilter } from '../domain/types';
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
        };
        this.reports.push(newReport);
        return newReport;
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
