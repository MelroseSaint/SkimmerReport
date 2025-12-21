import { db } from '../lib/instantdb.js';
import { id } from '@instantdb/react';
import type { Report, ReportFilter } from '../domain/types.js';
import type { ReportRepository } from '../domain/ReportRepository.js';


export class InstantReportRepository implements ReportRepository {
    async save(report: Omit<Report, 'id' | 'timestamp'>): Promise<Report> {
        const newReportId = id();
        const timestampMs = Date.now();

        // InstantDB transaction to save the report
        await db.transact(
            db.tx.reports[newReportId].update({
                report_id: report.report_id,
                latitude: report.location.latitude,
                longitude: report.location.longitude,
                merchant: report.merchant,
                category: report.category,
                observationType: report.observationType,
                description: report.description,
                timestamp: timestampMs,
                status: 'Under Review'
            })
        );

        const newReport: Report = {
            ...report,
            id: newReportId,
            timestamp: new Date(timestampMs).toISOString(),
            status: 'Under Review'
        };

        return newReport;
    }

    async getAll(_filter?: ReportFilter): Promise<Report[]> {
        console.warn('InstantReportRepository.getAll() called. Use db.useQuery() in components for real-time InstantDB data.');
        return [];
    }

    async getById(_id: string): Promise<Report | null> {
        console.warn('InstantReportRepository.getById() called. Use db.useQuery() in components for real-time InstantDB data.');
        return null;
    }
}
