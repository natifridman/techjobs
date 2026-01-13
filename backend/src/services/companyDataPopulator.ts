import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Normalize company name
function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

// CSV files for jobs
const JOB_CSV_FILES = [
  'admin', 'business', 'data-science', 'design', 'devops', 'finance',
  'frontend', 'hardware', 'hr', 'legal', 'marketing', 'procurement-operations',
  'product', 'project-management', 'qa', 'sales', 'security', 'software', 'support'
];

// Base salaries by company size (monthly ILS)
const SIZE_BASE_SALARIES: Record<string, { min: number; max: number }> = {
  'xs': { min: 15000, max: 28000 },  // 1-10 employees
  's': { min: 17000, max: 32000 },   // 11-50 employees
  'm': { min: 20000, max: 38000 },   // 51-200 employees
  'l': { min: 22000, max: 42000 },   // 201-1000 employees
  'xl': { min: 25000, max: 48000 },  // 1001+ employees
};

// Category multipliers
const CATEGORY_MULTIPLIERS: Record<string, number> = {
  'AI/ML': 1.25,
  'Cybersecurity': 1.2,
  'Fintech': 1.15,
  'Health': 1.1,
  'Semiconductors': 1.15,
  'Gaming': 1.05,
  'AdTech': 1.0,
  'Automotive': 1.1,
  'IoT': 1.05,
  'Aerospace': 1.15,
  'Productivity': 1.0,
  'Sustainable Technology': 1.0,
};

// Known high-paying companies (multiplier)
const HIGH_PAYING_COMPANIES: Record<string, number> = {
  'google': 1.5,
  'meta': 1.45,
  'apple': 1.45,
  'microsoft': 1.4,
  'amazon': 1.35,
  'nvidia': 1.5,
  'wiz': 1.45,
  'snyk': 1.3,
  'palo alto networks': 1.35,
  'crowdstrike': 1.3,
  'sentinelone': 1.25,
  'orca security': 1.35,
  'gong': 1.35,
  'monday.com': 1.25,
  'wix': 1.2,
  'fiverr': 1.2,
  'check point': 1.2,
  'cyberark': 1.2,
  'mobileye': 1.3,
  'intel': 1.2,
  'salesforce': 1.25,
  'datadog': 1.35,
};

interface CompanyJob {
  company: string;
  category: string;
  size: string;
}

// Parse CSV line
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

// Fetch all unique companies from job listings
export async function fetchAllCompaniesFromJobs(): Promise<CompanyJob[]> {
  console.log('🔄 Fetching companies from job listings...');
  
  const companiesMap = new Map<string, CompanyJob>();

  for (const category of JOB_CSV_FILES) {
    try {
      const response = await axios.get(
        `https://raw.githubusercontent.com/mluggy/techmap/main/jobs/${category}.csv`,
        { timeout: 10000 }
      );

      const lines = response.data.trim().split('\n');
      
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 3) {
          const company = values[0];
          const jobCategory = values[1];
          const size = values[2];

          if (company && !companiesMap.has(company.toLowerCase())) {
            companiesMap.set(company.toLowerCase(), {
              company,
              category: jobCategory,
              size,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching ${category} jobs:`, error instanceof Error ? error.message : 'Unknown');
    }
  }

  const companies = Array.from(companiesMap.values());
  console.log(`✅ Found ${companies.length} unique companies`);
  return companies;
}

// Calculate salary estimate for a company
function calculateSalaryEstimate(company: CompanyJob): { min: number; max: number } {
  const normalizedName = normalize(company.company);
  
  // Get base salary from company size
  const baseSalary = SIZE_BASE_SALARIES[company.size] || SIZE_BASE_SALARIES['m'];
  
  // Apply category multiplier
  const categoryMult = CATEGORY_MULTIPLIERS[company.category] || 1.0;
  
  // Check if it's a known high-paying company
  const companyMult = HIGH_PAYING_COMPANIES[normalizedName] || 1.0;
  
  const totalMult = categoryMult * companyMult;
  
  return {
    min: Math.round(baseSalary.min * totalMult / 1000) * 1000,
    max: Math.round(baseSalary.max * totalMult / 1000) * 1000,
  };
}

// Populate salary data for all companies
export async function populateAllCompanySalaries(): Promise<{ success: number; skipped: number; failed: number }> {
  console.log('🔄 Populating salary data for all companies...');
  
  const companies = await fetchAllCompaniesFromJobs();
  
  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const company of companies) {
    try {
      const normalizedName = normalize(company.company);
      
      // Check if we already have data for this company
      const { data: existing } = await supabase
        .from('salary_data')
        .select('id')
        .eq('company_name_normalized', normalizedName)
        .limit(1);

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      // Calculate salary estimate
      const estimate = calculateSalaryEstimate(company);
      
      // Store in database
      const { error } = await supabase
        .from('salary_data')
        .insert({
          company_name: company.company,
          company_name_normalized: normalizedName,
          job_title: 'Software Engineer',
          job_title_normalized: 'software engineer',
          location: 'Israel',
          min_salary: estimate.min,
          max_salary: estimate.max,
          median_salary: Math.round((estimate.min + estimate.max) / 2),
          currency: 'ILS',
          salary_type: 'monthly',
          sample_count: 0,
          source: 'estimated',
          source_url: null,
          confidence: 'medium',
          fetched_date: new Date().toISOString(),
        });

      if (error) {
        console.error(`Error storing ${company.company}:`, error.message);
        failed++;
      } else {
        success++;
      }
    } catch (error) {
      failed++;
      console.error(`Error processing ${company.company}:`, error);
    }
  }

  console.log(`✅ Populate complete: ${success} added, ${skipped} skipped, ${failed} failed`);
  return { success, skipped, failed };
}

// Get salary data for a company (with fallback to estimate)
export async function getCompanySalaryWithFallback(
  companyName: string,
  size: string,
  category: string
): Promise<{ min: number; max: number; source: string }> {
  const normalizedName = normalize(companyName);

  // Try to get from database
  const { data } = await supabase
    .from('salary_data')
    .select('min_salary, max_salary, source')
    .eq('company_name_normalized', normalizedName)
    .limit(1)
    .single();

  if (data && data.min_salary > 0) {
    return {
      min: data.min_salary,
      max: data.max_salary,
      source: data.source,
    };
  }

  // Calculate estimate
  const estimate = calculateSalaryEstimate({
    company: companyName,
    category,
    size,
  });

  return {
    min: estimate.min,
    max: estimate.max,
    source: 'calculated',
  };
}
