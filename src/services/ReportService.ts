import type { Report, ReportFilter, Location, ReportCategory, ObservationType } from '../domain/types';
import type { ReportRepository } from '../domain/ReportRepository';

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
        description?: string
    ): Promise<Report> {
        // In production, this would POST to a serverless endpoint
        // For now, use the in-memory repository
        return this.repository.save({
            location,
            category,
            observationType,
            description,
        });
    }

    async getReports(filter?: ReportFilter): Promise<Report[]> {
        return this.repository.getAll(filter);
    }

    async getReportById(id: string): Promise<Report | null> {
        return this.repository.getById(id);
    }
}
