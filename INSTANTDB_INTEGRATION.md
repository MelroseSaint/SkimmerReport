# InstantDB Integration for SkimmerWatch

## ✅ Setup Complete

### Database Configuration
- **App ID**: `d2000c2e-a83c-4ff8-a26f-1998cac6a67d`
- **Admin Token**: Configured in environment variables
- **Schema**: Synced with InstantDB cloud
- **Permissions**: Role-based access control enabled

---

## 📊 Database Schema

### Entities

#### `$users`
- `email` (string, unique, indexed, optional)
- `role` (string, indexed) - 'user', 'moderator', 'admin'
- `createdAt` (number, indexed)
- `isLocked` (boolean)
- `failedLoginAttempts` (number)

#### `reports`
- `report_id` (string, unique, indexed)
- `latitude` (number, indexed)
- `longitude` (number, indexed)
- `merchant` (string)
- `category` (string, indexed) - 'ATM', 'Gas pump', 'Store POS'
- `observationType` (string, indexed)
- `description` (string, optional)
- `timestamp` (number, indexed)
- `confidenceScore` (number, optional)
- `status` (string, indexed, optional)
- `statusReason` (string, optional)
- `reason` (string, optional)
- `confirmationReason` (string, optional)
- `lastEvaluatedAt` (number, optional)

#### `securityEvents`
- `timestamp` (number, indexed)
- `event_type` (string, indexed)
- `severity` (string, indexed)
- `ip_address` (string, indexed, optional)
- `user_agent` (string, optional)
- `endpoint` (string, optional)
- `method` (string, optional)
- `status_code` (number, optional)
- `details` (json)

### Links
- **userReports**: Links users to their reports (one-to-many)

---

## 🔐 Permissions

### Reports
- **View**: Anyone can read reports
- **Create**: Only authenticated users
- **Update**: Only report author or admin
- **Delete**: Only admin

### Users
- **View**: Users can view their own profile, admins can view all
- **Create**: Handled by auth system
- **Update**: Users can update own profile, admins can update anyone
- **Delete**: Only admins

### Security Events
- **View**: Only admins
- **Create**: System (for logging)
- **Update**: Immutable (no one)
- **Delete**: Only admins (for cleanup)

---

## 🚀 Usage Examples

### Frontend (React)

```typescript
import { db } from '@/lib/instantdb';
import { id } from '@instantdb/react';

// Query reports
function ReportsView() {
  const { isLoading, error, data } = db.useQuery({ 
    reports: {
      $: {
        where: {
          category: 'ATM',
          timestamp: { $gt: Date.now() - 86400000 } // Last 24h
        },
        order: { timestamp: 'desc' },
        limit: 50
      }
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.reports.map(report => (
        <div key={report.id}>{report.merchant}</div>
      ))}
    </div>
  );
}

// Create report
async function submitReport(location, category, observationType, description) {
  await db.transact(
    db.tx.reports[id()].update({
      report_id: Math.random().toString(36).substring(2, 11),
      latitude: location.latitude,
      longitude: location.longitude,
      category,
      observationType,
      description,
      merchant: 'Unknown',
      timestamp: Date.now(),
      status: 'Under Review'
    })
  );
}
```

### Backend (Admin SDK)

```typescript
import { adminDb } from '@/lib/instantdb-admin';
import { id } from '@instantdb/admin';

// Query all reports
const { reports } = await adminDb.query({ reports: {} });

// Create security event
await adminDb.transact(
  adminDb.tx.securityEvents[id()].update({
    timestamp: Date.now(),
    event_type: 'suspicious_activity',
    severity: 'high',
    ip_address: '192.168.1.1',
    details: { action: 'failed_login' }
  })
);

// Update report status
await adminDb.transact(
  adminDb.tx.reports[reportId].update({
    status: 'Community Supported',
    lastEvaluatedAt: Date.now()
  })
);
```

---

## 🔄 Migration from In-Memory Storage

### Step 1: Update ReportService
Replace `InMemoryReportRepository` with InstantDB queries:

```typescript
// Before
const repository = new InMemoryReportRepository();
const reportService = new ReportService(repository);

// After
import { db } from '@/lib/instantdb';
// Use db.useQuery() and db.transact() directly
```

### Step 2: Update API Endpoints
Modify `/api/reports.ts` to use InstantDB admin SDK:

```typescript
import { adminDb } from '@/lib/instantdb-admin';

// GET /api/reports
const { reports } = await adminDb.query({ 
  reports: {
    $: { order: { timestamp: 'desc' } }
  }
});

// POST /api/reports
await adminDb.transact(
  adminDb.tx.reports[id()].update({ ...reportData })
);
```

---

## 🌐 Environment Variables

### Development (.env.local)
```bash
VITE_INSTANT_APP_ID=d2000c2e-a83c-4ff8-a26f-1998cac6a67d
INSTANT_APP_ADMIN_TOKEN=f383e710-a96e-4a7a-9d39-779d090448a5
```

### Production (Vercel)
Add these to Vercel environment variables:
- `VITE_INSTANT_APP_ID`
- `INSTANT_APP_ADMIN_TOKEN`

---

## 📝 Next Steps

1. ✅ **Schema Pushed**: Database structure is live
2. ✅ **Permissions Set**: RBAC configured
3. ⏳ **Migrate Services**: Update ReportService to use InstantDB
4. ⏳ **Update Frontend**: Replace in-memory queries with InstantDB hooks
5. ⏳ **Test Integration**: Verify CRUD operations
6. ⏳ **Deploy**: Push to production

---

## 🔗 Resources
- [InstantDB Docs](https://instantdb.com/docs)
- [Schema Reference](https://instantdb.com/docs/modeling-data)
- [Permissions Guide](https://instantdb.com/docs/permissions)
- [React Hooks](https://instantdb.com/docs/instaql)

---

**Status**: ✅ Database Ready  
**Next**: Migrate application services to use InstantDB
