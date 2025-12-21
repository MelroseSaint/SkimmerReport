import { describe, it, expect } from 'vitest'
import { InMemoryReportRepository } from './InMemoryReportRepository'
import type { Report } from '../domain/types'

describe('InMemoryReportRepository', () => {
  it('updates confirmation across reports at same location', async () => {
    const repo = new InMemoryReportRepository()
    const loc = { latitude: 40.7128123, longitude: -74.0060123 }

    const r1 = await repo.save({ 
      location: loc, 
      category: 'ATM', 
      observationType: 'Overlay', 
      description: 'first',
      report_id: 'test-1',
      merchant: 'Test ATM'
    })
    expect(r1.status).toBe('Under Review')

    const r2 = await repo.save({ 
      location: loc, 
      category: 'ATM', 
      observationType: 'Overlay', 
      description: 'second',
      report_id: 'test-2',
      merchant: 'Test ATM'
    })
    expect(r2.status === 'Community Supported' || r2.status === 'Under Review').toBe(true)

    const all: Report[] = await repo.getAll()
    const atLoc = all.filter(r => Math.abs(r.location.latitude - loc.latitude) < 1e-4 && Math.abs(r.location.longitude - loc.longitude) < 1e-4)
    expect(atLoc.length).toBeGreaterThanOrEqual(2)
    // After second report, evaluation score should propagate and confirmation likely true
    expect(atLoc.every(r => typeof r.lastEvaluatedAt === 'string')).toBe(true)
    expect(atLoc.every(r => typeof r.confidenceScore === 'number')).toBe(true)
    expect(atLoc.some(r => r.status === 'Community Supported')).toBe(true)
    expect(atLoc.some(r => typeof r.confirmationReason === 'string')).toBe(true)
  })
})

