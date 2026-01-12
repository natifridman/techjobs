-- TechJobs Supabase Schema
-- Run this SQL in your Supabase SQL Editor (https://app.supabase.com)

-- Users table for OAuth
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saved jobs with user association
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  category TEXT,
  city TEXT,
  url TEXT NOT NULL,
  level TEXT,
  size TEXT,
  job_category TEXT,
  applied BOOLEAN DEFAULT FALSE,
  applied_date TIMESTAMPTZ,
  comments TEXT,
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, url)
);

-- Companies metadata
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  founded_year TEXT,
  headquarters TEXT,
  growth_summary TEXT,
  similar_companies JSONB DEFAULT '[]'::jsonb,
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Session table for connect-pg-simple (express-session persistence)
CREATE TABLE IF NOT EXISTS "session" (
  "sid" VARCHAR NOT NULL COLLATE "default",
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL,
  PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Indexes for better query performance
-- Note: email and companies.name already have UNIQUE constraints which create indexes
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_url ON saved_jobs(url);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_company ON saved_jobs(company);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Service role can do everything (for backend)
CREATE POLICY "Service role can manage users" ON users
  FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for saved_jobs table
-- Service role can do everything
CREATE POLICY "Service role can manage saved_jobs" ON saved_jobs
  FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for companies table
-- Everyone can read companies
CREATE POLICY "Anyone can read companies" ON companies
  FOR SELECT
  USING (true);

-- Service role can manage companies
CREATE POLICY "Service role can manage companies" ON companies
  FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for session table
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage sessions" ON "session"
  FOR ALL
  USING (auth.role() = 'service_role');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
DROP TRIGGER IF EXISTS update_users_updated_date ON users;
CREATE TRIGGER update_users_updated_date
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

DROP TRIGGER IF EXISTS update_saved_jobs_updated_date ON saved_jobs;
CREATE TRIGGER update_saved_jobs_updated_date
  BEFORE UPDATE ON saved_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

DROP TRIGGER IF EXISTS update_companies_updated_date ON companies;
CREATE TRIGGER update_companies_updated_date
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();
