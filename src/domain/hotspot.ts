import type { Report, Hotspot, Location, ReportCategory } from './types';

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number { return (deg * Math.PI) / 180; }

export function distanceMeters(a: Location, b: Location): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.asin(Math.sqrt(h));
  return EARTH_RADIUS_M * c;
}

const CATEGORY_SEVERITY: Record<ReportCategory, number> = {
  ATM: 1.0,
  'Gas pump': 1.0,
  'Store POS': 0.8,
};

export interface HotspotOptions {
  radiusMeters?: number;
  halfLifeDays?: number;
}

export function generateHotspots(
  reports: Report[],
  opts: HotspotOptions = {}
): Hotspot[] {
  const radius = opts.radiusMeters ?? 200;
  const halfLifeMs = (opts.halfLifeDays ?? 7) * 86400000;
  const now = Date.now();

  const unvisited = new Set(reports.map(r => r.id));
  const byId = new Map(reports.map(r => [r.id, r] as const));
  const hotspots: Hotspot[] = [];

  for (const id of [...unvisited]) {
    if (!unvisited.has(id)) continue;
    const seed = byId.get(id)!;
    const cluster: Report[] = [];

    // Gather nearby reports
    for (const other of reports) {
      if (!unvisited.has(other.id)) continue;
      if (distanceMeters(seed.location, other.location) <= radius) {
        cluster.push(other);
        unvisited.delete(other.id);
      }
    }

    // Compute center
    const lat = cluster.reduce((a, r) => a + r.location.latitude, 0) / cluster.length;
    const lon = cluster.reduce((a, r) => a + r.location.longitude, 0) / cluster.length;

    // Risk scoring with decay and severity
    let score = 0;
    let lastTs = 0;
    for (const r of cluster) {
      const ageMs = now - new Date(r.timestamp).getTime();
      lastTs = Math.max(lastTs, new Date(r.timestamp).getTime());
      const decay = Math.pow(0.5, ageMs / halfLifeMs); // half-life decay
      const severity = CATEGORY_SEVERITY[r.category] ?? 1.0;
      const confidence = r.confidenceScore ?? 1.0; // advisory only
      score += decay * severity * confidence;
    }

    hotspots.push({
      id: Math.random().toString(36).slice(2, 9),
      center: { latitude: lat, longitude: lon },
      radius,
      riskScore: Number(score.toFixed(3)),
      reportCount: cluster.length,
      lastReportTimestamp: new Date(lastTs || now).toISOString(),
    });
  }

  // Sort by score desc
  hotspots.sort((a, b) => b.riskScore - a.riskScore);
  return hotspots;
}

