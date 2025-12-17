export type ReportCategory = 'ATM' | 'Gas pump' | 'Store POS';

export type ObservationType =
    | 'Loose card slot'
    | 'Overlay'
    | 'Camera suspected'
    | 'Fraud after use'
    | 'Other';

export interface Location {
    latitude: number;
    longitude: number;
}

export interface Report {
    report_id: string; // Unique report identifier for automation
    id: string;
    location: Location;
    merchant: string; // Merchant name
    category: ReportCategory;
    observationType: ObservationType;
    description?: string;
    timestamp: string; // ISO string
    confidenceScore?: number; // Added for AI moderation later
    status?: 'Under Review' | 'Confirmed' | 'Rejected' | 'Error';
    reason?: string; // Reason for rejection or error
    confirmationReason?: string; // Reason for confirmation
    lastEvaluatedAt?: string; // ISO string
}

export interface ReportFilter {
    minTimestamp?: string;
    category?: ReportCategory;
    radius?: number; // In meters
    center?: Location;
}

export interface Hotspot {
    id: string;
    center: Location;
    radius: number; // in meters
    riskScore: number;
    reportCount: number;
    lastReportTimestamp: string;
}
