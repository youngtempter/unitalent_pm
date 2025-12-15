# How to Fix Missing GPA Column in PostgreSQL

## Problem
GPA field exists in Prisma schema but not in your PostgreSQL database.

## Solution

### Step 1: Check Migration Status
```bash
cd unitalent-backend-full
npx prisma migrate status
```

### Step 2: Apply Pending Migrations
If you see pending migrations, run:
```bash
npx prisma migrate deploy
```

OR for development:
```bash
npx prisma migrate dev
```

### Step 3: Regenerate Prisma Client
After migrations are applied:
```bash
npx prisma generate
```

### Step 4: Verify in Database
You can verify the column exists by checking your PostgreSQL database:
```sql
-- Connect to your database and run:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'gpa';
```

If the column doesn't exist, you can manually add it:
```sql
ALTER TABLE "User" ADD COLUMN "gpa" TEXT;
```

## Quick Fix (Manual SQL)
If migrations don't work, you can manually run this SQL in your PostgreSQL database:
```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gpa" TEXT;
```

Then regenerate Prisma client:
```bash
npx prisma generate
```



