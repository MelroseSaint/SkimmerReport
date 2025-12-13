import { describe, it, expect } from 'vitest'
import type { Report, ReportCategory, ObservationType, Location } from '../domain/types'
import { ReportServiceHybrid } from './ReportServiceHybrid'

class OkService {
  async submitReport(location: Location, category: ReportCategory, observationType: ObservationType, description?: string): Promise<Report> {
    return { id: '1', category, observationType, description, location, timestamp: new Date().toISOString() }
  }
  async getReports(): Promise<Report[]> { return [] }
}

class FailService {
  async submitReport(): Promise<Report> { throw new Error('fail') }
  async getReports(): Promise<Report[]> { throw new Error('fail') }
}

describe('ReportServiceHybrid', () => {
  it('uses primary when ok', async () => {
    const svc = new ReportServiceHybrid(new OkService() as any, new FailService() as any)
    const r = await svc.submitReport({ latitude: 1, longitude: 2 }, 'ATM', 'Overlay', 'd')
    expect(r.id).toBe('1')
  })
  it('falls back when primary fails', async () => {
    const svc = new ReportServiceHybrid(new FailService() as any, new OkService() as any)
    const r = await svc.submitReport({ latitude: 1, longitude: 2 }, 'ATM', 'Overlay', 'd')
    expect(r.id).toBe('1')
  })
})
