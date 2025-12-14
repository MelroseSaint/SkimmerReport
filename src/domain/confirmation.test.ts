import { describe, it, expect } from 'vitest'
import { evaluateReportsAtLocation } from './confirmation'
import type { Report, Location } from './types'

const locA: Location = { latitude: 10.123456, longitude: -20.987654 }
const locB: Location = { latitude: 10.123459, longitude: -20.987651 } // rounds to same site key

describe('evaluateReportsAtLocation', () => {
  it('confirms when multiple recent reports of same type exist', () => {
    const now = new Date().toISOString()
    const reports: Report[] = [
      { id: 'r1', location: locA, category: 'ATM', observationType: 'Overlay', timestamp: now },
      { id: 'r2', location: locB, category: 'ATM', observationType: 'Overlay', timestamp: now },
    ]
    const res = evaluateReportsAtLocation(reports, locA)
    expect(res.confirm).toBe(true)
    expect(res.score).toBeGreaterThanOrEqual(4)
    expect(typeof res.evaluatedAt).toBe('string')
    expect(res.reason).toBeDefined()
  })

  it('does not confirm with a single report', () => {
    const now = new Date().toISOString()
    const reports: Report[] = [
      { id: 'r1', location: locA, category: 'ATM', observationType: 'Overlay', timestamp: now },
    ]
    const res = evaluateReportsAtLocation(reports, locA)
    expect(res.confirm).toBe(false)
    expect(res.score).toBe(1)
    expect(res.reason).toBeUndefined()
  })
})

