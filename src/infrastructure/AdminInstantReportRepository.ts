import { adminDb } from '../lib/instantdb-admin';
import type { Report, ReportFilter } from '../domain/types';
import type { ReportRepository } from '../domain/ReportRepository';

export class AdminInstantReportRepository implements ReportRepository {
    async save(report: Omit<Report, 'id' | 'timestamp'>): Promise<Report> {
        const timestampMs = Date.now();
        const existingId = (report as any).id;

        const finalId = existingId || Math.random().toString(36).substring(2, 15);

        await adminDb.transact(
            adminDb.tx.reports[finalId].update({
                report_id: report.report_id,
                latitude: report.location.latitude,
                longitude: report.location.longitude,
                merchant: report.merchant,
                category: report.category,
                observationType: report.observationType,
                description: report.description,
                timestamp: timestampMs,
                status: (report as any).status || 'Under Review'
            })
        );

        return {
            ...report,
            id: finalId,
            timestamp: new Date(timestampMs).toISOString()
        } as Report;
    }

    async getAll(_filter?: ReportFilter): Promise<Report[]> {
        const { reports } = await adminDb.query({
            reports: {
                $: {
                    order: { timestamp: 'desc' }
                }
            }
        });

        return reports.map(r => ({
            id: r.id,
            report_id: r.report_id,
            location: { latitude: r.latitude, longitude: r.longitude },
            merchant: r.merchant,
            category: r.category as any,
            observationType: r.observationType as any,
            description: r.description,
            timestamp: new Date(r.timestamp).toISOString(),
            status: r.status as any
        })) as Report[];
    }

    async getById(id: string): Promise<Report | null> {
        const { reports } = await adminDb.query({
            reports: {
                $: {
                    where: { id: id }
                }
            }
        });

        if (reports.length === 0) return null;

        const r = reports[0];
        return {
            id: r.id,
            report_id: r.report_id,
            location: { latitude: r.latitude, longitude: r.longitude },
            merchant: r.merchant,
            category: r.category as any,
            observationType: r.observationType as any,
            description: r.description,
            timestamp: new Date(r.timestamp).toISOString(),
            status: r.status as any
        } as Report;
    }
}
