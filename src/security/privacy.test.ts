import { describe, it, expect } from 'vitest'
import type { Report } from '../domain/types'
import {
  fuzzLocation,
  sanitizeReportForPublic,
  RETENTION_POLICIES,
  shouldAnonymize,
  anonymizeReport,
  shouldDelete,
  exportSafeReports,
  generatePrivacyMetadata
} from '../privacy'

describe('Privacy Protection', () => {
  const mockReport: Report = {
    id: 'report-123',
    report_id: 'user-456',
    location: { latitude: 40.7128, longitude: -74.0060 },
    merchant: 'Test Store ATM',
    category: 'ATM',
    observationType: 'Loose card slot',
    description: 'Found suspicious device on ATM',
    timestamp: '2024-01-15T10:30:00Z',
    status: 'Under Review',
    confidenceScore: 0.8,
    lastEvaluatedAt: '2024-01-15T10:31:00Z',
    confirmationReason: 'Multiple reports'
  }

  describe('fuzzLocation', () => {
    it('adds random jitter to coordinates', () => {
      const original = { latitude: 40.7128, longitude: -74.0060 }
      const fuzzed1 = fuzzLocation(original)
      const fuzzed2 = fuzzLocation(original)

      expect(fuzzed1).not.toEqual(original)
      expect(fuzzed2).not.toEqual(original)
      expect(fuzzed1).not.toEqual(fuzzed2)
    })

    it('respects precision limits', () => {
      const location = { latitude: 40.712812345, longitude: -74.006012345 }
      const fuzzed = fuzzLocation(location)

      expect(fuzzed.latitude).toStrictEqual(expect.any(Number))
      expect(fuzzed.longitude).toStrictEqual(expect.any(Number))
      expect(fuzzed.latitude.toString()).toMatch(/^\-?\d+\.\d{4}$/)
      expect(fuzzed.longitude.toString()).toMatch(/^\-?\d+\.\d{4}$/)
    })

    it('allows custom precision', () => {
      const location = { latitude: 40.7128, longitude: -74.0060 }
      const fuzzed = fuzzLocation(location, 300)

      expect(fuzzed.latitude).toStrictEqual(expect.any(Number))
      expect(fuzzed.longitude).toStrictEqual(expect.any(Number))
    })

    it('does not create invalid coordinates', () => {
      const location = { latitude: 40.7128, longitude: -74.0060 }
      const fuzzed = fuzzLocation(location)

      expect(fuzzed.latitude).toBeGreaterThanOrEqual(-90)
      expect(fuzzed.latitude).toBeLessThanOrEqual(90)
      expect(fuzzed.longitude).toBeGreaterThanOrEqual(-180)
      expect(fuzzed.longitude).toBeLessThanOrEqual(180)
    })
  })

  describe('sanitizeReportForPublic', () => {
    it('removes internal fields', () => {
      const sanitized = sanitizeReportForPublic(mockReport)

      expect(sanitized).not.toHaveProperty('confidenceScore')
      expect(sanitized).not.toHaveProperty('lastEvaluatedAt')
      expect(sanitized).not.toHaveProperty('confirmationReason')
      expect(sanitized).not.toHaveProperty('statusReason')
    })

    it('preserves public fields', () => {
      const sanitized = sanitizeReportForPublic(mockReport)

      expect(sanitized).toHaveProperty('id', mockReport.id)
      expect(sanitized).toHaveProperty('report_id', mockReport.report_id)
      expect(sanitized).toHaveProperty('category', mockReport.category)
      expect(sanitized).toHaveProperty('observationType', mockReport.observationType)
      expect(sanitized).toHaveProperty('timestamp', mockReport.timestamp)
      expect(sanitized).toHaveProperty('status', mockReport.status)
    })

    it('applies location fuzzing', () => {
      const sanitized = sanitizeReportForPublic(mockReport)

      expect(sanitized.location).not.toEqual(mockReport.location)
      expect(sanitized.location).toHaveProperty('latitude')
      expect(sanitized.location).toHaveProperty('longitude')
    })

    it('sanitizes merchant name', () => {
      const reportWithPII = {
        ...mockReport,
        merchant: 'Store ATM 555-1234 contact@store.com'
      }
      const sanitized = sanitizeReportForPublic(reportWithPII)

      expect(sanitized.merchant).not.toContain('555-1234')
      expect(sanitized.merchant).not.toContain('contact@store.com')
    })

    it('sanitizes description', () => {
      const reportWithPII = {
        ...mockReport,
        description: 'Call me at 555-1234 or email test@example.com for details'
      }
      const sanitized = sanitizeReportForPublic(reportWithPII)

      expect(sanitized.description).not.toContain('555-1234')
      expect(sanitized.description).not.toContain('test@example.com')
    })
  })

  describe('sanitizeMerchantName', () => {
    it('removes phone numbers', () => {
      expect(sanitizeMerchantName('Store 555-1234')).not.toContain('555-1234')
      expect(sanitizeMerchantName('Store 555 123 4567')).not.toContain('555 123 4567')
    })

    it('removes email addresses', () => {
      expect(sanitizeMerchantName('Store contact@store.com')).not.toContain('contact@store.com')
    })

    it('removes street addresses', () => {
      expect(sanitizeMerchantName('Store 123 Main St')).not.toContain('123 Main St')
      expect(sanitizeMerchantName('Store 456 Oak Avenue')).not.toContain('456 Oak Avenue')
    })

    it('limits length', () => {
      const longName = 'Very Long Store Name That Exceeds The Maximum Allowed Length For Merchant Names In This System'.repeat(2)
      const sanitized = sanitizeMerchantName(longName)
      expect(sanitized.length).toBeLessThanOrEqual(100)
    })

    it('returns Unknown for invalid input', () => {
      expect(sanitizeMerchantName('')).toBe('Unknown')
      expect(sanitizeMerchantName('Unknown')).toBe('Unknown')
    })

    it('preserves legitimate information', () => {
      const validName = 'Downtown Shopping Center ATM'
      const sanitized = sanitizeMerchantName(validName)
      expect(sanitized).toBe(validName)
    })
  })

  describe('sanitizeDescription', () => {
    it('removes PII patterns', () => {
      const desc = 'Call 555-1234 or email test@example.com. Located at 123 Main St.'
      const sanitized = sanitizeDescription(desc)

      expect(sanitized).not.toContain('555-1234')
      expect(sanitized).not.toContain('test@example.com')
      expect(sanitized).not.toContain('123 Main St')
    })

    it('removes SSN patterns', () => {
      expect(sanitizeDescription('My SSN is 123-45-6789')).not.toContain('123-45-6789')
    })

    it('removes credit card numbers', () => {
      expect(sanitizeDescription('Card 4111-1111-1111-1111')).not.toContain('4111-1111-1111-1111')
      expect(sanitizeDescription('Card 4111111111111111')).not.toContain('4111111111111111')
    })

    it('removes URLs', () => {
      expect(sanitizeDescription('Visit https://evil.com for more info')).not.toContain('https://evil.com')
      expect(sanitizeDescription('Visit http://malicious.site')).not.toContain('http://malicious.site')
    })

    it('removes script content', () => {
      expect(sanitizeDescription('<script>alert("xss")</script>')).not.toContain('<script>')
      expect(sanitizeDescription('javascript:alert("xss")')).not.toContain('javascript:')
    })

    it('limits length', () => {
      const longDesc = 'Very long description that exceeds the maximum allowed length. '.repeat(20)
      const sanitized = sanitizeDescription(longDesc)
      expect(sanitized.length).toBeLessThanOrEqual(500)
    })

    it('handles empty input', () => {
      expect(sanitizeDescription('')).toBe('')
      expect(sanitizeDescription(null as any)).toBe('')
    })
  })

  describe('RETENTION_POLICIES', () => {
    it('has defined policies for all data types', () => {
      expect(RETENTION_POLICIES).toHaveProperty('reports')
      expect(RETENTION_POLICIES).toHaveProperty('automation_logs')
      expect(RETENTION_POLICIES).toHaveProperty('security_logs')
    })

    it('has reasonable retention periods', () => {
      expect(RETENTION_POLICIES.reports.maxAgeDays).toBeGreaterThan(0)
      expect(RETENTION_POLICIES.reports.deleteAfterDays).toBeGreaterThan(RETENTION_POLICIES.reports.maxAgeDays)
      expect(RETENTION_POLICIES.automation_logs.maxAgeDays).toBeGreaterThan(0)
      expect(RETENTION_POLICIES.security_logs.maxAgeDays).toBeGreaterThan(0)
    })
  })

  describe('shouldAnonymize', () => {
    it('returns false for recent data', () => {
      const recentTimestamp = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
      expect(shouldAnonymize(recentTimestamp, RETENTION_POLICIES.reports)).toBe(false)
    })

    it('returns true for old data with anonymization policy', () => {
      const oldTimestamp = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString() // 100 days ago
      expect(shouldAnonymize(oldTimestamp, RETENTION_POLICIES.reports)).toBe(true)
    })

    it('returns false when no anonymization policy', () => {
      const policy = { maxAgeDays: 30 }
      const timestamp = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
      expect(shouldAnonymize(timestamp, policy)).toBe(false)
    })
  })

  describe('anonymizeReport', () => {
    it('removes sensitive fields', () => {
      const anonymized = anonymizeReport(mockReport)

      expect(anonymized.merchant).toBe('Anonymized Location')
      expect(anonymized.description).toBe('[Content anonymized for privacy]')
      expect(anonymized.confidenceScore).toBeUndefined()
      expect(anonymized.confirmationReason).toBeUndefined()
      expect(anonymized.statusReason).toBeUndefined()
    })

    it('applies increased fuzzing to location', () => {
      const anonymized = anonymizeReport(mockReport)

      expect(anonymized.location).not.toEqual(mockReport.location)
      // Increased fuzzing should be more aggressive than normal fuzzing
    })

    it('preserves basic structure', () => {
      const anonymized = anonymizeReport(mockReport)

      expect(anonymized).toHaveProperty('id', mockReport.id)
      expect(anonymized).toHaveProperty('report_id', mockReport.report_id)
      expect(anonymized).toHaveProperty('category', mockReport.category)
      expect(anonymized).toHaveProperty('observationType', mockReport.observationType)
      expect(anonymized).toHaveProperty('timestamp', mockReport.timestamp)
      expect(anonymized).toHaveProperty('status', mockReport.status)
    })

    it('handles reports without descriptions', () => {
      const reportWithoutDesc = { ...mockReport, description: undefined }
      const anonymized = anonymizeReport(reportWithoutDesc)

      expect(anonymized.description).toBe('[Content anonymized for privacy]')
    })
  })

  describe('shouldDelete', () => {
    it('returns false for recent data', () => {
      const recentTimestamp = new Date().toISOString()
      expect(shouldDelete(recentTimestamp, RETENTION_POLICIES.reports)).toBe(false)
    })

    it('returns true for very old data', () => {
      const oldTimestamp = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString() // 3 years ago
      expect(shouldDelete(oldTimestamp, RETENTION_POLICIES.reports)).toBe(true)
    })

    it('returns false when no deletion policy', () => {
      const policy = { maxAgeDays: 30 }
      const timestamp = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
      expect(shouldDelete(timestamp, policy)).toBe(false)
    })
  })

  describe('exportSafeReports', () => {
    it('removes internal fields', () => {
      const exported = exportSafeReports([mockReport])
      const exportedReport = exported[0]

      expect(exportedReport).not.toHaveProperty('confidenceScore')
      expect(exportedReport).not.toHaveProperty('lastEvaluatedAt')
      expect(exportedReport).not.toHaveProperty('confirmationReason')
      expect(exportedReport).not.toHaveProperty('statusReason')
    })

    it('reduces coordinate precision', () => {
      const exported = exportSafeReports([mockReport])
      const exportedReport = exported[0]

      expect(exportedReport.location.latitude.toString()).toMatch(/^\-?\d+\.\d{3}$/)
      expect(exportedReport.location.longitude.toString()).toMatch(/^\-?\d+\.\d{3}$/)
    })

    it('sanitizes merchant names', () => {
      const reportWithPII = {
        ...mockReport,
        merchant: 'Store 555-1234 contact@store.com'
      }
      const exported = exportSafeReports([reportWithPII])
      const exportedReport = exported[0]

      expect(exportedReport.merchant).not.toContain('555-1234')
      expect(exportedReport.merchant).not.toContain('contact@store.com')
    })

    it('handles multiple reports', () => {
      const reports = [mockReport, { ...mockReport, id: 'report-456' }]
      const exported = exportSafeReports(reports)

      expect(exported).toHaveLength(2)
      exported.forEach(report => {
        expect(report).not.toHaveProperty('confidenceScore')
      })
    })
  })

  describe('generatePrivacyMetadata', () => {
    it('returns comprehensive metadata', () => {
      const metadata = generatePrivacyMetadata()

      expect(metadata).toHaveProperty('last_anonymized')
      expect(metadata).toHaveProperty('retention_policies', RETENTION_POLICIES)
      expect(metadata).toHaveProperty('data_subject_rights')
      expect(metadata).toHaveProperty('legal_basis')
      expect(metadata).toHaveProperty('data_controller')
      expect(metadata).toHaveProperty('contact')
    })

    it('includes all data subject rights', () => {
      const metadata = generatePrivacyMetadata()
      const expectedRights = ['Access', 'Correction', 'Deletion', 'Portability', 'Restriction']

      expectedRights.forEach(right => {
        expect(metadata.data_subject_rights).toContain(right)
      })
    })

    it('has valid timestamp', () => {
      const metadata = generatePrivacyMetadata()
      const timestamp = new Date(metadata.last_anonymized)

      expect(timestamp).toBeInstanceOf(Date)
      expect(isNaN(timestamp.getTime())).toBe(false)
    })

    it('includes controller information', () => {
      const metadata = generatePrivacyMetadata()

      expect(typeof metadata.data_controller).toBe('string')
      expect(typeof metadata.contact).toBe('string')
      expect(metadata.data_controller).toBeTruthy()
      expect(metadata.contact).toBeTruthy()
    })
  })
})