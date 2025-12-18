# Skimmer Report Automation System

## Overview

The Skimmer Report Automation System provides fully automated handling of new skimmer reports, including validation, status updates, email notifications, and daily summaries.

## Features

### ✅ Core Automation Workflow
- **Real-time Processing**: Handles new reports instantly upon submission
- **Validation**: Validates required fields (report_id, location, merchant, timestamp)
- **Duplicate Detection**: Identifies and rejects duplicate reports within 24 hours
- **Status Management**: Automatically updates report statuses (Confirmed, Rejected, Error)
- **Email Notifications**: Sends real-time emails for confirmed reports
- **Daily Summaries**: Optional daily summary emails at 11:59 PM server time

### ✅ Comprehensive Logging
- **Separate Log Sections**: Organized logs for confirmed reports, unconfirmed reports, email activity, and errors
- **Timestamped Actions**: All automation steps are logged with timestamps
- **Exportable Logs**: Logs can be exported for auditing and review
- **Error Tracking**: Detailed error logging with retry mechanisms

## API Endpoints

### 1. Process New Report
**Endpoint**: `POST /api/automation`

**Request Body**:
```json
{
  "report_id": "RPT-001234",
  "location": {
    "latitude": 40.2591,
    "longitude": -76.8825
  },
  "merchant": "Gas Station ABC",
  "category": "Gas pump",
  "observationType": "Loose card slot",
  "timestamp": "2025-12-17T10:00:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Report automation completed successfully",
  "report_id": "RPT-001234",
  "timestamp": "2025-12-18T15:30:52.194Z"
}
```

### 2. Get Automation Logs
**Endpoint**: `GET /api/automation`

**Query Parameters**:
- `report_id` (optional): Get logs for specific report
- `export=true` (optional): Export all logs as downloadable file

**Response**:
```json
{
  "sections": {
    "confirmedReports": [...],
    "unconfirmedReports": [...],
    "emailActivity": [...],
    "errors": [...]
  },
  "timestamp": "2025-12-18T15:30:52.194Z"
}
```

### 3. Trigger Daily Summary
**Endpoint**: `POST /api/daily-summary`

**Response**:
```json
{
  "success": true,
  "message": "Daily summary triggered successfully",
  "timestamp": "2025-12-18T15:30:52.194Z"
}
```

## Email Templates

### Confirmed Report Notification
**Subject**: `Skimmer Report Confirmed – [report_id]`

**Body**:
```
Hello,

A new skimmer report has been confirmed on SkimmerWatch.

Confirmed Reports:
- Report ID: [report_id]
- Location: [latitude], [longitude]
- Merchant: [merchant]
- Timestamp: [timestamp]
- Status: Confirmed

View Report: https://skimmer-report.vercel.app/reports/[report_id]

This is an automated notification. No reply needed.

Thank you,
SkimmerWatch Automation
```

### Daily Summary
**Subject**: `SkimmerWatch Daily Report Summary – [date]`

**Body**:
```
Hello,

Daily Skimmer Report Summary – [date]

Confirmed Reports:
- [report_id] | [location] | [merchant] | [timestamp]
- (list all confirmed reports from today)

Unconfirmed Reports:
- [report_id] | [location] | [merchant] | [timestamp] | Status: [Rejected/Under Review]
- (list all unconfirmed reports from today)

This is an automated summary. No reply needed.

Thank you,
SkimmerWatch Automation
```

## Automation Rules

### Validation Rules
- `report_id`: Required, non-empty string
- `location`: Required, valid latitude and longitude
- `merchant`: Required, non-empty string
- `timestamp`: Required, valid ISO date string

### Status Updates
- **Valid + Unique**: Status = "Confirmed" → Real-time email sent
- **Invalid**: Status = "Rejected" → No email sent
- **Duplicate**: Status = "Rejected" → No email sent
- **Email Failed**: Status = "Error" → Error logged

### Duplicate Detection
- Checks for reports with same merchant within 100m radius
- Time window: 24 hours from original report
- Automatic rejection with "Duplicate report" reason

## Error Handling

### Retry Logic
- Email failures are retried once
- Status update failures are logged
- Persistent errors set report status to "Error"

### Error Categories
- **Validation Errors**: Missing or invalid required fields
- **Duplicate Errors**: Report already exists
- **Email Errors**: Notification delivery failures
- **System Errors**: Repository or service failures

## Configuration

### Email Settings
- **Recipient**: Monroedoses@gmail.com
- **Sender**: no-reply@skimmer-report.vercel.app
- **Daily Summary Time**: 11:59 PM server time

### Logging
- **Log Retention**: In-memory (persist to database in production)
- **Log Export**: Text format with organized sections
- **Error Detail**: Full error messages and stack traces

## Testing

### Automated Tests
```bash
npm run test
```

### Manual Workflow Test
```bash
npx tsx test-automation.ts
```

### Test Coverage
- ✅ Report validation
- ✅ Duplicate detection
- ✅ Email notifications
- ✅ Error handling
- ✅ Status updates
- ✅ Daily summary generation
- ✅ Log organization and export

## Integration

### Frontend Integration
```javascript
// Submit new report with automation
const response = await fetch('/api/automation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(reportData)
});
```

### Serverless Deployment
- Compatible with Vercel serverless functions
- No external dependencies required
- Environment variables for email service configuration

## Production Considerations

### Email Service Integration
- Configure with Vercel Email API, SendGrid, AWS SES, or Resend
- Set `RESEND_API_KEY` or appropriate environment variables
- Update email sending logic in `api/send-email.ts`

### Database Persistence
- Replace in-memory repositories with persistent storage
- Maintain automation logs in database for long-term retention
- Implement log cleanup policies

### Monitoring
- Set up alerts for high error rates
- Monitor email delivery success rates
- Track automation performance metrics

## Security

### Input Validation
- All report fields validated before processing
- SQL injection protection via repository pattern
- XSS protection in email templates

### Access Control
- API endpoints with CORS configuration
- Rate limiting considerations for production
- Audit trail maintained in automation logs

---

**Status**: ✅ Fully functional and tested  
**Integration**: Ready for deployment to https://skimmer-report.vercel.app/  
**Support**: Complete error handling and logging system implemented