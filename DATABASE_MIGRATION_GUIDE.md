# Database Migration & Setup Guide

This guide walks through the database changes and setup procedures for the School ERP gap fixes.

## Prisma Schema Updates

### New Models Added

1. **Activity Model**
   - Tracks all user actions for audit trails
   - Includes timestamp, user, action, and resource information
   - Indexed for fast queries

2. **ActivityType Enum**
   - Categorizes types of actions (LOGIN, CREATE, UPDATE, DELETE, etc.)

3. **ActivityAction Enum**
   - Detailed action descriptions for activity tracking

### User Model Updates

Added three new fields:
```prisma
passwordResetToken    String?   @unique
passwordResetExpires  DateTime?
```

## Migration Steps

### Step 1: Backup Current Database
```bash
# PostgreSQL backup
pg_dump school_erp > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use Prisma's backup approach
npm run prisma:studio  # Export data if needed
```

### Step 2: Update Prisma Schema
```bash
# Schema has been updated automatically
# Review: backend/prisma/schema.prisma
```

### Step 3: Generate Prisma Client
```bash
cd backend
npm run prisma:generate
```

### Step 4: Create and Apply Migration
```bash
# Create a migration for the new schema
npm run prisma:migrate -- --name add_activities_and_password_reset

# This will:
# - Create the Activity table
# - Add password reset fields to User table
# - Create necessary indexes
```

### Step 5: Verify Migration
```bash
# Check migration status
npx prisma migrate status

# View generated SQL
cat prisma/migrations/<timestamp>_add_activities_and_password_reset/migration.sql
```

## Manual Migration (If Auto-migration Fails)

### For PostgreSQL

```sql
-- Create ActivityType enum
CREATE TYPE "ActivityType" AS ENUM (
  'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW',
  'DOWNLOAD', 'UPLOAD', 'APPROVE', 'REJECT', 'PAYMENT',
  'ATTENDANCE_MARK', 'EXPORT', 'IMPORT'
);

-- Create ActivityAction enum
CREATE TYPE "ActivityAction" AS ENUM (
  'USER_LOGIN', 'USER_LOGOUT', 'STUDENT_CREATE', 'STUDENT_UPDATE',
  'STUDENT_DELETE', 'STAFF_CREATE', 'STAFF_UPDATE', 'STAFF_DELETE',
  'FEE_PAYMENT', 'ATTENDANCE_MARK', 'EXAM_MARK', 'TIMETABLE_CREATE',
  'DOCUMENT_UPLOAD', 'DOCUMENT_DOWNLOAD', 'EXPORT_DATA', 'IMPORT_DATA',
  'APPROVE_REQUEST', 'REJECT_REQUEST', 'SETTINGS_CHANGE', 'OTHER'
);

-- Add password reset fields to users table
ALTER TABLE "users"
ADD COLUMN "passwordResetToken" TEXT UNIQUE,
ADD COLUMN "passwordResetExpires" TIMESTAMP;

-- Create activities table
CREATE TABLE "activities" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "action" "ActivityAction" NOT NULL,
  "actionType" "ActivityType" NOT NULL,
  "module" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "resourceId" TEXT,
  "resourceType" TEXT,
  "changes" JSONB,
  "status" TEXT NOT NULL DEFAULT 'SUCCESS',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX "activities_userId_idx" ON "activities"("userId");
CREATE INDEX "activities_createdAt_idx" ON "activities"("createdAt");
CREATE INDEX "activities_action_idx" ON "activities"("action");
CREATE INDEX "activities_module_idx" ON "activities"("module");
```

## Rollback (If Needed)

### Using Prisma

```bash
# List migrations
npm run prisma:migrate -- --list

# Resolve migration (if stuck)
npm run prisma:migrate -- resolve --rolled-back <migration_name>
```

### Manual Rollback (PostgreSQL)

```sql
-- Remove activities table
DROP TABLE IF EXISTS "activities";

-- Remove enums
DROP TYPE IF EXISTS "ActivityAction";
DROP TYPE IF EXISTS "ActivityType";

-- Remove password reset columns
ALTER TABLE "users"
DROP COLUMN IF EXISTS "passwordResetToken",
DROP COLUMN IF EXISTS "passwordResetExpires";
```

## Data Migration for Existing Systems

### If You Have Existing Activity Log Data

Migrate from old logging table (if exists):

```sql
-- If you had an old activity_logs table
INSERT INTO "activities" (
  "id", "userId", "action", "actionType", "module", 
  "description", "status", "createdAt"
)
SELECT 
  gen_random_uuid(),
  "userId",
  CAST("action" AS "ActivityAction"),
  'OTHER'::\"ActivityType\",
  "module",
  "description",
  'SUCCESS',
  "createdAt"
FROM activity_logs
WHERE "userId" IS NOT NULL;
```

## Verify Setup

### Check Schema
```bash
npx prisma db push --skip-generate
```

### Inspect Database
```bash
# Using Prisma Studio
npm run prisma:studio

# Using psql
psql school_erp -c "\dt"  # List tables
psql school_erp -c "\d activities"  # Describe activities table
```

### Test Activity Logging

```javascript
// In Node.js REPL
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test activity creation
const activity = await prisma.activity.create({
  data: {
    userId: 'test-user-id',
    action: 'USER_LOGIN',
    actionType: 'LOGIN',
    module: 'auth',
    description: 'User logged in',
    status: 'SUCCESS'
  }
});

console.log('Activity created:', activity);

// Test password reset token
const user = await prisma.user.update({
  where: { id: 'test-user-id' },
  data: {
    passwordResetToken: 'test-token',
    passwordResetExpires: new Date(Date.now() + 3600000) // 1 hour
  }
});

console.log('User updated with reset token');

await prisma.$disconnect();
```

## Environment Variables

Add these to your `.env` file if not already present:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/school_erp

# Email (for password reset)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Frontend for password reset links
FRONTEND_URL=http://localhost:3000
```

## Deployment Considerations

### Backup Strategy
```bash
# Before migration
pg_dump school_erp > pre_migration_backup.sql

# Schedule regular backups
# Add to cron: 0 2 * * * pg_dump school_erp > backups/backup_$(date +\%Y\%m\%d).sql
```

### Performance Monitoring
```bash
# Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Monitor activity table growth
SELECT COUNT(*) FROM "activities";

# Monitor activities by date
SELECT DATE("createdAt"), COUNT(*) FROM "activities" 
GROUP BY DATE("createdAt") 
ORDER BY DATE("createdAt") DESC;
```

### Cleanup Jobs

Add scheduled tasks to clean old activities:

```javascript
// backend/scripts/cleanup.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupOldActivities() {
  const daysToKeep = 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.activity.deleteMany({
    where: {
      createdAt: { lt: cutoffDate }
    }
  });

  console.log(`Deleted ${result.count} old activities`);
  await prisma.$disconnect();
}

cleanupOldActivities().catch(e => {
  console.error(e);
  process.exit(1);
});
```

Schedule with cron:
```
# Run cleanup every Sunday at 2 AM
0 2 * * 0 cd /path/to/backend && node scripts/cleanup.js
```

## Troubleshooting

### Migration Stuck
```bash
# Reset local development database (CAUTION!)
npm run prisma:migrate -- reset

# Then run migrations fresh
npm run prisma:migrate -- deploy
```

### Connection Errors
```bash
# Check database connection
npm run prisma:db -- push

# Or test connection manually
psql $DATABASE_URL -c "SELECT 1"
```

### Memory Issues with Large Tables
```bash
# If migration times out, increase timeout
npx prisma db push --skip-generate --timeout 300
```

### Enum Type Conflicts

If you get enum conflicts:
```bash
# Check existing enums
psql school_erp -c "SELECT * FROM pg_type WHERE typname LIKE '%Activity%';"

# Drop conflicting enum (if safe)
psql school_erp -c "DROP TYPE IF EXISTS \"ActivityType\" CASCADE;"
```

## Verification Checklist

After migration:

- [ ] Schema updated successfully
- [ ] `activities` table created
- [ ] Indexes created on activities table
- [ ] `passwordResetToken` and `passwordResetExpires` fields added to users
- [ ] Prisma client regenerated
- [ ] Application starts without errors
- [ ] Activity logging works (test with API)
- [ ] Password reset functionality works
- [ ] Database backups successful
- [ ] No data loss detected

## Next Steps

1. **Test Activity Logging**: Create test activities via API
2. **Test Password Reset**: Request password reset and verify email
3. **Monitor Performance**: Watch database performance metrics
4. **Plan Cleanup**: Setup automated cleanup for old activities
5. **Document Changes**: Update internal documentation

## Support

If you encounter issues:

1. Check Prisma error messages
2. Review database logs
3. Verify environment variables
4. Check file permissions
5. Ensure database user has necessary privileges

---

For more information on Prisma migrations: https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate
