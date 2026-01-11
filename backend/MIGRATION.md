# Database Migration: SQLite to Supabase

This document describes how to migrate from the SQLite database to Supabase (PostgreSQL).

## Prerequisites

1. A Supabase account and project (https://supabase.com)
2. Access to your Supabase project's SQL Editor

## Step 1: Create the Supabase Schema

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase-schema.sql` and run it
4. This will create:
   - `users` table (for OAuth users)
   - `saved_jobs` table (for user's saved jobs)
   - `companies` table (for company metadata)
   - Appropriate indexes
   - Row Level Security (RLS) policies
   - Auto-update triggers for `updated_date`

## Step 2: Get Your API Keys

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Service Role Key** (under "service_role" - keep this secret!)

## Step 3: Configure Environment Variables

Add these to your `.env` file (for local development) or your deployment platform (Render, Railway, etc.):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

## Step 4: Migrate Existing Data (Optional)

If you have existing data in SQLite that needs to be migrated:

### Export from SQLite

```sql
-- Run these in your SQLite database
.mode csv
.headers on
.output users.csv
SELECT * FROM users;
.output saved_jobs.csv
SELECT * FROM saved_jobs;
.output companies.csv
SELECT * FROM companies;
```

### Import to Supabase

1. Go to **Table Editor** in Supabase Dashboard
2. Select each table
3. Click "Import data from CSV"
4. Upload the corresponding CSV file

**Note:** You may need to adjust UUID formats and date formats during import.

## Step 5: Deploy

1. Ensure your deployment platform has the new environment variables
2. Deploy your updated backend code
3. The new code will automatically use Supabase instead of SQLite

## Session Storage Note

⚠️ **Important:** This migration removes SQLite-based session storage. The current implementation uses in-memory sessions which will be lost on server restart.

For production, consider using:
- Redis for session storage
- Supabase Auth for full authentication
- A dedicated session store like `connect-pg-simple` for PostgreSQL

## Rollback

To rollback to SQLite:
1. Revert the code changes (git checkout the previous version)
2. Remove the Supabase environment variables
3. Restore your SQLite database file

## Troubleshooting

### "Missing Supabase configuration" error
- Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set
- Check that there are no typos in the environment variable names

### Authentication errors
- Verify the service role key is correct (not the anon key)
- Check RLS policies allow service role access

### Data not appearing
- Clear browser cookies and localStorage
- Log out and log back in to create a new session
