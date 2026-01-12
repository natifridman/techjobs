import { createClient } from '@supabase/supabase-js';

// Database types
export interface User {
  id: string;
  google_id: string;
  email: string;
  name: string;
  picture: string;
  created_date: string;
  updated_date: string;
}

export interface SavedJob {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  category?: string | null;
  city?: string | null;
  url: string;
  level?: string | null;
  size?: string | null;
  job_category?: string | null;
  applied: boolean;
  applied_date?: string | null;
  comments?: string | null;
  created_date: string;
  updated_date: string;
}

export interface Company {
  id: string;
  name: string;
  description?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
  founded_year?: string | null;
  headquarters?: string | null;
  growth_summary?: string | null;
  similar_companies?: string[] | null;
  created_date: string;
  updated_date: string;
}

// Initialize Supabase client
// IMPORTANT: Backend requires SUPABASE_SERVICE_KEY to bypass RLS policies
// The anon key will NOT work - RLS policies require service_role
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Set these environment variables:');
  console.error('   SUPABASE_URL=your-project-url');
  console.error('   SUPABASE_SERVICE_KEY=your-service-role-key');
  console.error('');
  console.error('⚠️  Note: SUPABASE_ANON_KEY will NOT work for backend operations.');
  console.error('   The service role key is required to bypass Row Level Security (RLS) policies.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('✅ Supabase client initialized');

export default supabase;
