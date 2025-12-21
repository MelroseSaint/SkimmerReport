# SkimmerWatch Security Architecture

## Overview
SkimmerWatch implements **Enterprise-Grade Security** with a **Zero-Trust Architecture** and **Defense-in-Depth** strategy.

---

## Security Layers

### 1. **Authentication & Identity**
- **Password Hashing**: bcrypt with cost factor 12
- **Session Management**: JWT tokens with 1-hour expiration
- **Account Protection**: Auto-lock after 5 failed login attempts
- **Future**: MFA support (TOTP + backup codes)

### 2. **Authorization (RBAC)**
- **Roles**: `user`, `moderator`, `admin`
- **Permissions**: Fine-grained access control
  - `reports:read` - View reports
  - `reports:write` - Submit reports
  - `reports:moderate` - Review/flag reports
  - `admin:all` - Full system access

### 3. **API Security**

#### Rate Limiting
- **10 requests/hour per IP** (configurable)
- Automatic cleanup of old entries
- Graceful degradation under load

#### Input Validation
- **XSS Protection**: Strip script tags, event handlers
- **SQL Injection Prevention**: Parameterized queries only
- **Path Traversal**: Block `../` patterns
- **Command Injection**: Filter shell metacharacters

#### Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=63072000
Content-Security-Policy: [strict policy]
```

### 4. **Advanced Threat Detection**

#### IP Filtering
- **Blacklist**: Auto-ban after 10 suspicious activities
- **Whitelist**: Trusted IPs bypass certain checks
- **Honeypot Endpoints**: Trap automated scanners

#### Pattern Detection
- SQL injection attempts
- XSS payloads
- Path traversal
- Command injection
- Slowloris attacks

### 5. **Audit & Monitoring**

#### Security Event Logging
All security events are logged with:
- Timestamp (ISO 8601)
- Event type
- Severity level (low/medium/high/critical)
- IP address
- User agent
- Endpoint
- Details

#### Event Types
- `blocked_request` - Blacklisted IP or malicious pattern
- `rate_limit_exceeded` - Too many requests
- `invalid_input` - Validation failure
- `suspicious_activity` - Anomalous behavior
- `automation_trigger` - Report processing
- `csp_violation` - Content Security Policy breach

### 6. **Data Protection**

#### At Rest
- Sensitive data encrypted
- PII minimization
- Secure deletion policies

#### In Transit
- HTTPS enforced (HSTS)
- TLS 1.2+ only
- Certificate pinning (future)

---

## Deployment Security

### Environment Variables
**NEVER commit these to Git:**
```bash
JWT_SECRET=<high-entropy-secret-64+chars>
ALLOWED_ORIGINS=https://yourdomain.com
DATABASE_URL=<connection-string>
```

### Vercel Configuration
1. Add secrets via Vercel Dashboard
2. Enable automatic HTTPS
3. Configure custom domains
4. Set up WAF rules (if available)

---

## Incident Response

### If Breach Detected
1. **Isolate**: Block affected IPs immediately
2. **Investigate**: Review security logs
3. **Notify**: Alert administrators
4. **Patch**: Fix vulnerability
5. **Monitor**: Watch for repeat attempts

### Security Metrics Dashboard
Access via `/api/security/metrics` (admin only):
- Total security events
- Events by type
- Events by severity
- Last 24h activity
- Critical events in last hour

---

## Compliance & Best Practices

### OWASP Top 10 Coverage
✅ Injection Prevention  
✅ Broken Authentication Protection  
✅ Sensitive Data Exposure Mitigation  
✅ XML External Entities (N/A)  
✅ Broken Access Control Prevention  
✅ Security Misconfiguration Hardening  
✅ Cross-Site Scripting (XSS) Protection  
✅ Insecure Deserialization (N/A)  
✅ Using Components with Known Vulnerabilities (npm audit)  
✅ Insufficient Logging & Monitoring (Comprehensive)  

### Regular Security Tasks
- [ ] Weekly: Review security logs
- [ ] Monthly: Rotate JWT secrets
- [ ] Quarterly: Penetration testing
- [ ] Annually: Full security audit

---

## Future Enhancements
1. **MFA**: TOTP + SMS backup
2. **OAuth**: Google, GitHub integration
3. **Biometric**: WebAuthn support
4. **Anomaly Detection**: ML-based threat detection
5. **Geo-Blocking**: Country-level restrictions
6. **DDoS Protection**: Cloudflare integration

---

## Contact
For security issues, contact: security@skimmerwatch.com
