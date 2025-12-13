import type { Report, ReportFilter } from './types.js';

export interface ReportRepository {
    save(report: Omit<Report, 'id' | 'timestamp'>): Promise<Report>;
    getAll(filter?: ReportFilter): Promise<Report[]>;
    getById(id: string): Promise<Report | null>;
}
