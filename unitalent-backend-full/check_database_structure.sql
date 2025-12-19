-- ============================================
-- Check User Table Structure
-- Run these queries in pgAdmin Query Tool
-- ============================================

-- 1. Check all columns in the User table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- 2. Check if specific columns exist (should return rows for existing columns)
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'User' 
  AND column_name IN (
    'id', 'email', 'password', 'role',
    'firstName', 'lastName', 'username',
    'phone', 'university', 'major', 'studyYear', 'gpa', 'city',
    'skills', 'bio', 'github', 'linkedin', 'portfolio',
    'bin', 'companySize', 'industry',
    'avatarUrl', 'scheduleJson', 'transcriptHtml',
    'createdAt'
  )
ORDER BY column_name;

-- 3. Check for missing columns (columns that SHOULD exist according to Prisma)
-- This will show what's missing
SELECT 
    'id' as expected_column, 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'id') THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
UNION ALL
SELECT 'email', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'email') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'password', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'password') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'role', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'role') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'firstName', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'firstName') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'lastName', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'lastName') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'username', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'username') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'phone', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'phone') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'university', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'university') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'major', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'major') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'studyYear', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'studyYear') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'gpa', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'gpa') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'city', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'city') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'skills', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'skills') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'bio', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'bio') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'github', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'github') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'linkedin', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'linkedin') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'portfolio', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'portfolio') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'bin', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'bin') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'companySize', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'companySize') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'industry', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'industry') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'avatarUrl', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'avatarUrl') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'scheduleJson', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'scheduleJson') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'transcriptHtml', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'transcriptHtml') THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'createdAt', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'createdAt') THEN '✓ EXISTS' ELSE '✗ MISSING' END;

-- 4. Check constraints and indexes
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'User'::regclass;

-- 5. Check if Role enum exists
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'Role'
ORDER BY e.enumsortorder;


