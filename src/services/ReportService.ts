import type { Report, ReportFilter, Location, ReportCategory, ObservationType } from '../domain/types.js';
import type { ReportRepository } from '../domain/ReportRepository.js';

/**
 * ReportService - API adapter for report operations
 * Uses fetch for RESTful communication with backend
 */
export class ReportService {
    private repository: ReportRepository;

    constructor(repository: ReportRepository) {
        this.repository = repository;
    }

    async submitReport(
        location: Location,
        category: ReportCategory,
        observationType: ObservationType,
        description?: string,
        merchant?: string
    ): Promise<Report> {
        // In production, this would POST to a serverless endpoint
        // For now, use the provided repository
        return this.repository.save({
            location,
            category,
            observationType,
            description,
            merchant: merchant || 'Unknown',
            report_id: Math.random().toString(36).substring(2, 11),
        });
    }

    async getReports(filter?: ReportFilter): Promise<Report[]> {
        return this.repository.getAll(filter);
    }

    async getReportById(id: string): Promise<Report | null> {
        return this.repository.getById(id);
    }
}
