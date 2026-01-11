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
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Set these environment variables:');
  console.error('   SUPABASE_URL=your-project-url');
  console.error('   SUPABASE_SERVICE_KEY=your-service-role-key (or SUPABASE_ANON_KEY for dev)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase client initialized');

export default supabase;
