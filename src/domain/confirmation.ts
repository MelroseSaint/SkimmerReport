import type { Report, Location, ReportCategory } from './types'

function siteKey(loc: Location): string {
  const r = (n: number) => Math.round(n * 10000) / 10000
  return `${r(loc.latitude)},${r(loc.longitude)}`
}

export interface EvaluationResult {
  score: number
  confirm: boolean
  reason?: string
  evaluatedAt: string
}

export function evaluateReportsAtLocation(all: Report[], loc: Location): EvaluationResult {
  const key = siteKey(loc)
  const group = all.filter(r => siteKey(r.location) === key)
  const now = Date.now()
  let score = 0

  // +1 per unique user reporting same location (no user id yet, treat each report as unique)
  score += group.length

  // +1 if reports occur within a defined time window (rolling 7 days)
  const withinWindow = group.filter(r => (now - new Date(r.timestamp).getTime()) < 7 * 86400000).length
  if (withinWindow >= 2) score += 1

  // +2 if reports reference the same device type
  const byCat = new Map<ReportCategory, number>()
  group.forEach(r => byCat.set(r.category, (byCat.get(r.category) || 0) + 1))
  const sameTypeMax = Math.max(0, ...Array.from(byCat.values()))
  if (sameTypeMax >= 2) score += 2

  // +3 if reporter is trusted (no data available, skip)

  const evaluatedAt = new Date().toISOString()
  const confirm = score >= 4
  const reason = confirm ? 'Confirmed by multiple independent reports' : undefined
  return { score, confirm, reason, evaluatedAt }
}
