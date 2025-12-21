import { describe, it, expect, beforeEach } from 'vitest'
import {
  sanitizeText,
  sanitizeMerchant,
  sanitizeCoordinates,
  validateReportId,
  validateTimestamp,
  validateObservationType,
  validateCategory,
  rateLimiter,
  detectSuspiciousRequest,
  getClientIp,
  generateAntiBotToken,
  validateAntiBotToken
} from './validation'

describe('Security Validation', () => {
  beforeEach(() => {
    // Clear rate limiter before each test
    (rateLimiter as any).limits.clear()
  })

  describe('sanitizeText', () => {
    it('removes script tags', () => {
      const input = '<script>alert("xss")</script>Hello World'
      expect(sanitizeText(input)).toBe('Hello World')
    })

    it('removes iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>Content'
      expect(sanitizeText(input)).toBe('Content')
    })

    it('removes javascript: URLs', () => {
      const input = 'javascript:alert("xss") and text'
      expect(sanitizeText(input)).toBe('alert(xss) and text')
    })

    it('removes event handlers', () => {
      const input = '<div onclick="alert(\'xss\')">Click me</div>'
      expect(sanitizeText(input)).toBe('div alert(\'xss\')Click me/div')
    })

    it('removes eval expressions', () => {
      const input = 'eval("malicious code") text'
      expect(sanitizeText(input)).toBe('malicious code) text')
    })

    it('limits text length', () => {
      const longInput = 'a'.repeat(600)
      expect(sanitizeText(longInput)).toHaveLength(500)
    })

    it('removes invalid characters', () => {
      const input = 'Hello<>World@#$%^&*()'
      expect(sanitizeText(input)).toBe('HelloWorld@#&()')
    })

    it('handles non-string input', () => {
      expect(sanitizeText(null as any)).toBe('')
      expect(sanitizeText(123 as any)).toBe('')
      expect(sanitizeText({} as any)).toBe('')
    })

    it('preserves allowed characters', () => {
      const input = 'Hello World 123 - Test @example.com'
      expect(sanitizeText(input)).toBe('Hello World 123 - Test @example.com')
    })
  })

  describe('sanitizeMerchant', () => {
    it('removes abusive patterns', () => {
      expect(sanitizeMerchant('Police Department ATM')).toBe('Department ATM')
      expect(sanitizeMerchant('FBI Headquarters')).toBe('Headquarters')
      expect(sanitizeMerchant('Official Government ATM')).toBe('ATM')
    })

    it('removes law enforcement references', () => {
      expect(sanitizeMerchant('Law Enforcement ATM')).toBe('ATM')
      expect(sanitizeMerchant('Investigation Unit ATM')).toBe('Unit ATM')
      expect(sanitizeMerchant('Case #123 ATM')).toBe('123 ATM')
    })

    it('returns Unknown for invalid input', () => {
      expect(sanitizeMerchant('')).toBe('Unknown')
      expect(sanitizeMerchant(null as any)).toBe('Unknown')
      expect(sanitizeMerchant(123 as any)).toBe('Unknown')
    })

    it('limits merchant name length', () => {
      const longName = 'Very Long Merchant Name That Exceeds The Maximum Allowed Length'.repeat(2)
      expect(sanitizeMerchant(longName).length).toBeLessThanOrEqual(100)
    })

    it('removes invalid characters', () => {
      expect(sanitizeMerchant('Store<>Name@#$')).toBe('StoreName@#')
    })
  })

  describe('sanitizeCoordinates', () => {
    it('validates latitude and longitude ranges', () => {
      expect(sanitizeCoordinates(40.7128, -74.0060)).toEqual({
        latitude: 40.7128,
        longitude: -74.0060
      })
    })

    it('rejects invalid latitude', () => {
      expect(sanitizeCoordinates(91, 0)).toBeNull()
      expect(sanitizeCoordinates(-91, 0)).toBeNull()
    })

    it('rejects invalid longitude', () => {
      expect(sanitizeCoordinates(0, 181)).toBeNull()
      expect(sanitizeCoordinates(0, -181)).toBeNull()
    })

    it('handles NaN values', () => {
      expect(sanitizeCoordinates(NaN, 0)).toBeNull()
      expect(sanitizeCoordinates(0, NaN)).toBeNull()
      expect(sanitizeCoordinates(NaN, NaN)).toBeNull()
    })

    it('handles string coordinates', () => {
      expect(sanitizeCoordinates('40.7128', '-74.0060')).toEqual({
        latitude: 40.7128,
        longitude: -74.0060
      })
    })

    it('rounds to appropriate precision', () => {
      const result = sanitizeCoordinates(40.7128123456789, -74.0060123456789)
      expect(result?.latitude).toBe(40.712812)
      expect(result?.longitude).toBe(-74.006012)
    })
  })

  describe('validateReportId', () => {
    it('accepts valid report IDs', () => {
      expect(validateReportId('report-123')).toBe(true)
      expect(validateReportId('abc_123')).toBe(true)
      expect(validateReportId('REPORT123')).toBe(true)
    })

    it('rejects invalid characters', () => {
      expect(validateReportId('report@123')).toBe(false)
      expect(validateReportId('report/123')).toBe(false)
      expect(validateReportId('report.123')).toBe(false)
    })

    it('rejects empty or too long IDs', () => {
      expect(validateReportId('')).toBe(false)
      expect(validateReportId('a'.repeat(51))).toBe(false)
    })

    it('rejects non-string input', () => {
      expect(validateReportId(123 as any)).toBe(false)
      expect(validateReportId(null as any)).toBe(false)
      expect(validateReportId({} as any)).toBe(false)
    })
  })

  describe('validateTimestamp', () => {
    it('accepts valid ISO timestamps', () => {
      // Check if the current year matches the timestamp format expectations
      const now = new Date()
      const currentYear = now.getFullYear()
      const testTimestamp = `${currentYear}-01-15T10:30:00Z`
      
      expect(validateTimestamp(testTimestamp)).toBe(true)
      expect(validateTimestamp(`${currentYear}-01-15T10:30:00.123Z`)).toBe(true)
    })

    it('rejects invalid formats', () => {
      expect(validateTimestamp('2024-01-15')).toBe(false)
      expect(validateTimestamp('15-01-2024')).toBe(false)
      expect(validateTimestamp('invalid-date')).toBe(false)
    })

    it('rejects dates too far in past', () => {
      const oldDate = new Date()
      oldDate.setFullYear(oldDate.getFullYear() - 2)
      expect(validateTimestamp(oldDate.toISOString())).toBe(false)
    })

    it('rejects dates too far in future', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 2)
      expect(validateTimestamp(futureDate.toISOString())).toBe(false)
    })

    it('rejects non-string input', () => {
      expect(validateTimestamp(1234567890 as any)).toBe(false)
      expect(validateTimestamp(null as any)).toBe(false)
    })
  })

  describe('validateObservationType', () => {
    it('accepts valid observation types', () => {
      expect(validateObservationType('Loose card slot')).toBe(true)
      expect(validateObservationType('Overlay')).toBe(true)
      expect(validateObservationType('Camera suspected')).toBe(true)
      expect(validateObservationType('Fraud after use')).toBe(true)
      expect(validateObservationType('Other')).toBe(true)
    })

    it('rejects invalid observation types', () => {
      expect(validateObservationType('Invalid Type')).toBe(false)
      expect(validateObservationType('')).toBe(false)
      expect(validateObservationType(null as any)).toBe(false)
      expect(validateObservationType(123 as any)).toBe(false)
    })
  })

  describe('validateCategory', () => {
    it('accepts valid categories', () => {
      expect(validateCategory('ATM')).toBe(true)
      expect(validateCategory('Gas pump')).toBe(true)
      expect(validateCategory('Store POS')).toBe(true)
    })

    it('rejects invalid categories', () => {
      expect(validateCategory('Invalid')).toBe(false)
      expect(validateCategory('')).toBe(false)
      expect(validateCategory(null as any)).toBe(false)
      expect(validateCategory(123 as any)).toBe(false)
    })
  })

  describe('Rate Limiting', () => {
    it('allows requests within limit', () => {
      expect(rateLimiter.isAllowed('user1')).toBe(true)
      expect(rateLimiter.isAllowed('user1')).toBe(true)
      expect(rateLimiter.isAllowed('user1')).toBe(true)
    })

    it('blocks requests exceeding limit', () => {
      // Exhaust the limit (10 requests per hour)
      for (let i = 0; i < 10; i++) {
        rateLimiter.isAllowed('user2')
      }
      expect(rateLimiter.isAllowed('user2')).toBe(false)
    })

    it('resets after time window', () => {
      rateLimiter.isAllowed('user3')
      
      // Mock time passage by directly manipulating the internal state
      const entry = (rateLimiter as any).limits.get('user3')
      entry.firstRequest = Date.now() - 61 * 60 * 1000 // 61 minutes ago
      
      expect(rateLimiter.isAllowed('user3')).toBe(true)
    })

    it('tracks remaining requests', () => {
      expect(rateLimiter.getRemainingRequests('user4')).toBe(10)
      
      for (let i = 0; i < 3; i++) {
        rateLimiter.isAllowed('user4')
      }
      
      expect(rateLimiter.getRemainingRequests('user4')).toBe(7)
    })

    it('handles different users independently', () => {
      rateLimiter.isAllowed('user5')
      
      // User6 should still have full limit
      expect(rateLimiter.getRemainingRequests('user6')).toBe(10)
    })
  })

  describe('Suspicious Request Detection', () => {
    it('detects missing user agent', () => {
      const req = {
        headers: {}
      }
      
      const result = detectSuspiciousRequest(req)
      expect(result.isSuspicious).toBe(true)
      expect(result.reasons).toContain('Missing or short User-Agent')
    })

    it('detects bot-like user agents', () => {
      const botAgents = [
        'Googlebot/2.1',
        'Mozilla/5.0 (compatible; bingbot/2.0)',
        'curl/7.68.0',
        'python-requests/2.25.1'
      ]
      
      botAgents.forEach(agent => {
        const req = {
          headers: { 'user-agent': agent }
        }
        
        const result = detectSuspiciousRequest(req)
        expect(result.isSuspicious).toBe(true)
        expect(result.reasons).toContain('Bot-like User-Agent detected')
      })
    })

    it('detects missing accept header', () => {
      const req = {
        headers: { 'user-agent': 'Mozilla/5.0' }
      }
      
      const result = detectSuspiciousRequest(req)
      expect(result.isSuspicious).toBe(true)
      expect(result.reasons).toContain('Missing Accept header')
    })

    it('detects rate limit exceeded', () => {
      // Exhaust rate limit for test IP
      for (let i = 0; i < 10; i++) {
        rateLimiter.isAllowed('192.168.1.1')
      }
      
      const req = {
        headers: { 'user-agent': 'Mozilla/5.0', accept: 'text/html' },
        connection: { remoteAddress: '192.168.1.1' }
      }
      
      const result = detectSuspiciousRequest(req)
      expect(result.isSuspicious).toBe(true)
      expect(result.reasons).toContain('Rate limit exceeded')
    })

    it('allows legitimate requests', () => {
      const req = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          accept: 'text/html,application/xhtml+xml'
        },
        connection: { remoteAddress: '192.168.1.2' }
      }
      
      const result = detectSuspiciousRequest(req)
      expect(result.isSuspicious).toBe(false)
      expect(result.reasons).toHaveLength(0)
    })
  })

  describe('IP Extraction', () => {
    it('extracts IP from x-forwarded-for header', () => {
      const req = {
        headers: { 'x-forwarded-for': '203.0.113.1, 192.168.1.1' }
      }
      
      expect(getClientIp(req)).toBe('203.0.113.1')
    })

    it('extracts IP from x-real-ip header', () => {
      const req = {
        headers: { 'x-real-ip': '203.0.113.2' }
      }
      
      expect(getClientIp(req)).toBe('203.0.113.2')
    })

    it('falls back to connection remote address', () => {
      const req = {
        headers: {},
        connection: { remoteAddress: '192.168.1.1' }
      }
      
      expect(getClientIp(req)).toBe('192.168.1.1')
    })

    it('returns unknown for missing IP', () => {
      const req = {
        headers: {}
      }
      
      expect(getClientIp(req)).toBe('unknown')
    })
  })

  describe('Anti-Bot Tokens', () => {
    it('generates valid tokens', () => {
      const token = generateAntiBotToken()
      expect(token).toHaveLength(32)
      expect(typeof token).toBe('string')
    })

    it('validates fresh tokens', () => {
      const token = generateAntiBotToken()
      expect(validateAntiBotToken(token)).toBe(true)
    })

    it('rejects expired tokens', () => {
      // Create an old token by manipulating the timestamp
      const timestamp = Date.now() - 31 * 60 * 1000 // 31 minutes ago
      const random = Math.random().toString(36).substring(2, 11)
      const token = Buffer.from(`${timestamp}-${random}`).toString('base64').substring(0, 32)
      
      expect(validateAntiBotToken(token)).toBe(false)
    })

    it('rejects invalid tokens', () => {
      expect(validateAntiBotToken('')).toBe(false)
      expect(validateAntiBotToken('invalid')).toBe(false)
      expect(validateAntiBotToken('YWJjZGVm')).toBe(false)
    })

    it('rejects tokens with invalid timestamps', () => {
      const token = Buffer.from(`invalid-${Math.random().toString(36).substring(2, 11)}`).toString('base64').substring(0, 32)
      
      expect(validateAntiBotToken(token)).toBe(false)
    })
  })
})