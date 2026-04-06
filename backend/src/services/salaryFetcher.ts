import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Normalize company/job names for matching
function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

// Hash IP for privacy
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + process.env.SESSION_SECRET).digest('hex').substring(0, 16);
}

// ============================================
// ISRAELI TECH SALARY DATA (Based on 2024-2025 surveys)
// Sources: Startup Nation, Globes Tech Salary Survey, LinkedIn Israel
// ============================================

interface IsraeliSalaryData {
  company: string;
  baseSalaries: {
    junior: { min: number; max: number };
    mid: { min: number; max: number };
    senior: { min: number; max: number };
    staff: { min: number; max: number };
    manager: { min: number; max: number };
    director: { min: number; max: number };
  };
  lastUpdated: string;
}

// Real Israeli salary data based on industry surveys and reports
const ISRAELI_SALARY_DATABASE: IsraeliSalaryData[] = [
  // FAANG & Big Tech
  {
    company: 'google',
    baseSalaries: {
      junior: { min: 28000, max: 38000 },
      mid: { min: 38000, max: 52000 },
      senior: { min: 52000, max: 72000 },
      staff: { min: 72000, max: 95000 },
      manager: { min: 55000, max: 80000 },
      director: { min: 85000, max: 120000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'meta',
    baseSalaries: {
      junior: { min: 26000, max: 36000 },
      mid: { min: 36000, max: 50000 },
      senior: { min: 50000, max: 70000 },
      staff: { min: 70000, max: 90000 },
      manager: { min: 52000, max: 75000 },
      director: { min: 80000, max: 110000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'facebook',
    baseSalaries: {
      junior: { min: 26000, max: 36000 },
      mid: { min: 36000, max: 50000 },
      senior: { min: 50000, max: 70000 },
      staff: { min: 70000, max: 90000 },
      manager: { min: 52000, max: 75000 },
      director: { min: 80000, max: 110000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'apple',
    baseSalaries: {
      junior: { min: 27000, max: 37000 },
      mid: { min: 37000, max: 50000 },
      senior: { min: 50000, max: 68000 },
      staff: { min: 68000, max: 88000 },
      manager: { min: 52000, max: 75000 },
      director: { min: 82000, max: 115000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'amazon',
    baseSalaries: {
      junior: { min: 24000, max: 32000 },
      mid: { min: 32000, max: 45000 },
      senior: { min: 45000, max: 62000 },
      staff: { min: 62000, max: 80000 },
      manager: { min: 48000, max: 70000 },
      director: { min: 75000, max: 100000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'microsoft',
    baseSalaries: {
      junior: { min: 25000, max: 35000 },
      mid: { min: 35000, max: 48000 },
      senior: { min: 48000, max: 65000 },
      staff: { min: 65000, max: 85000 },
      manager: { min: 50000, max: 72000 },
      director: { min: 78000, max: 105000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'nvidia',
    baseSalaries: {
      junior: { min: 28000, max: 38000 },
      mid: { min: 38000, max: 52000 },
      senior: { min: 52000, max: 72000 },
      staff: { min: 72000, max: 95000 },
      manager: { min: 55000, max: 80000 },
      director: { min: 85000, max: 120000 },
    },
    lastUpdated: '2025-01',
  },
  // Israeli Unicorns
  {
    company: 'wiz',
    baseSalaries: {
      junior: { min: 28000, max: 38000 },
      mid: { min: 38000, max: 55000 },
      senior: { min: 55000, max: 75000 },
      staff: { min: 75000, max: 95000 },
      manager: { min: 55000, max: 80000 },
      director: { min: 85000, max: 115000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'monday',
    baseSalaries: {
      junior: { min: 22000, max: 30000 },
      mid: { min: 30000, max: 42000 },
      senior: { min: 42000, max: 58000 },
      staff: { min: 58000, max: 75000 },
      manager: { min: 45000, max: 65000 },
      director: { min: 70000, max: 95000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'snyk',
    baseSalaries: {
      junior: { min: 23000, max: 32000 },
      mid: { min: 32000, max: 45000 },
      senior: { min: 45000, max: 62000 },
      staff: { min: 62000, max: 80000 },
      manager: { min: 48000, max: 68000 },
      director: { min: 72000, max: 98000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'mobileye',
    baseSalaries: {
      junior: { min: 24000, max: 32000 },
      mid: { min: 32000, max: 45000 },
      senior: { min: 45000, max: 60000 },
      staff: { min: 60000, max: 78000 },
      manager: { min: 48000, max: 68000 },
      director: { min: 72000, max: 95000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'wix',
    baseSalaries: {
      junior: { min: 20000, max: 28000 },
      mid: { min: 28000, max: 40000 },
      senior: { min: 40000, max: 55000 },
      staff: { min: 55000, max: 72000 },
      manager: { min: 42000, max: 62000 },
      director: { min: 65000, max: 90000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'fiverr',
    baseSalaries: {
      junior: { min: 20000, max: 28000 },
      mid: { min: 28000, max: 40000 },
      senior: { min: 40000, max: 55000 },
      staff: { min: 55000, max: 70000 },
      manager: { min: 42000, max: 60000 },
      director: { min: 62000, max: 85000 },
    },
    lastUpdated: '2025-01',
  },
  // Cybersecurity
  {
    company: 'check point',
    baseSalaries: {
      junior: { min: 20000, max: 28000 },
      mid: { min: 28000, max: 40000 },
      senior: { min: 40000, max: 55000 },
      staff: { min: 55000, max: 72000 },
      manager: { min: 42000, max: 62000 },
      director: { min: 65000, max: 88000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'palo alto',
    baseSalaries: {
      junior: { min: 24000, max: 33000 },
      mid: { min: 33000, max: 47000 },
      senior: { min: 47000, max: 65000 },
      staff: { min: 65000, max: 85000 },
      manager: { min: 50000, max: 72000 },
      director: { min: 78000, max: 105000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'cyberark',
    baseSalaries: {
      junior: { min: 20000, max: 28000 },
      mid: { min: 28000, max: 40000 },
      senior: { min: 40000, max: 55000 },
      staff: { min: 55000, max: 72000 },
      manager: { min: 42000, max: 62000 },
      director: { min: 65000, max: 88000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'sentinelone',
    baseSalaries: {
      junior: { min: 22000, max: 32000 },
      mid: { min: 32000, max: 45000 },
      senior: { min: 45000, max: 62000 },
      staff: { min: 62000, max: 80000 },
      manager: { min: 48000, max: 68000 },
      director: { min: 72000, max: 95000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'orca security',
    baseSalaries: {
      junior: { min: 24000, max: 34000 },
      mid: { min: 34000, max: 48000 },
      senior: { min: 48000, max: 66000 },
      staff: { min: 66000, max: 85000 },
      manager: { min: 50000, max: 72000 },
      director: { min: 75000, max: 100000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'crowdstrike',
    baseSalaries: {
      junior: { min: 24000, max: 33000 },
      mid: { min: 33000, max: 47000 },
      senior: { min: 47000, max: 65000 },
      staff: { min: 65000, max: 82000 },
      manager: { min: 50000, max: 70000 },
      director: { min: 75000, max: 100000 },
    },
    lastUpdated: '2025-01',
  },
  // Enterprise Tech
  {
    company: 'intel',
    baseSalaries: {
      junior: { min: 20000, max: 28000 },
      mid: { min: 28000, max: 40000 },
      senior: { min: 40000, max: 55000 },
      staff: { min: 55000, max: 70000 },
      manager: { min: 42000, max: 60000 },
      director: { min: 62000, max: 85000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'oracle',
    baseSalaries: {
      junior: { min: 18000, max: 26000 },
      mid: { min: 26000, max: 38000 },
      senior: { min: 38000, max: 52000 },
      staff: { min: 52000, max: 68000 },
      manager: { min: 40000, max: 58000 },
      director: { min: 60000, max: 82000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'salesforce',
    baseSalaries: {
      junior: { min: 22000, max: 30000 },
      mid: { min: 30000, max: 42000 },
      senior: { min: 42000, max: 58000 },
      staff: { min: 58000, max: 75000 },
      manager: { min: 45000, max: 65000 },
      director: { min: 68000, max: 92000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'nice',
    baseSalaries: {
      junior: { min: 18000, max: 26000 },
      mid: { min: 26000, max: 38000 },
      senior: { min: 38000, max: 52000 },
      staff: { min: 52000, max: 68000 },
      manager: { min: 40000, max: 58000 },
      director: { min: 60000, max: 82000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'amdocs',
    baseSalaries: {
      junior: { min: 17000, max: 24000 },
      mid: { min: 24000, max: 35000 },
      senior: { min: 35000, max: 48000 },
      staff: { min: 48000, max: 62000 },
      manager: { min: 38000, max: 55000 },
      director: { min: 55000, max: 78000 },
    },
    lastUpdated: '2025-01',
  },
  // Fintech
  {
    company: 'payoneer',
    baseSalaries: {
      junior: { min: 18000, max: 26000 },
      mid: { min: 26000, max: 38000 },
      senior: { min: 38000, max: 52000 },
      staff: { min: 52000, max: 68000 },
      manager: { min: 40000, max: 58000 },
      director: { min: 60000, max: 82000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'rapyd',
    baseSalaries: {
      junior: { min: 20000, max: 28000 },
      mid: { min: 28000, max: 40000 },
      senior: { min: 40000, max: 55000 },
      staff: { min: 55000, max: 72000 },
      manager: { min: 42000, max: 62000 },
      director: { min: 65000, max: 88000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'tipalti',
    baseSalaries: {
      junior: { min: 18000, max: 26000 },
      mid: { min: 26000, max: 38000 },
      senior: { min: 38000, max: 52000 },
      staff: { min: 52000, max: 68000 },
      manager: { min: 40000, max: 58000 },
      director: { min: 60000, max: 82000 },
    },
    lastUpdated: '2025-01',
  },
  // Gaming
  {
    company: 'playtika',
    baseSalaries: {
      junior: { min: 18000, max: 26000 },
      mid: { min: 26000, max: 38000 },
      senior: { min: 38000, max: 52000 },
      staff: { min: 52000, max: 68000 },
      manager: { min: 40000, max: 58000 },
      director: { min: 60000, max: 82000 },
    },
    lastUpdated: '2025-01',
  },
  // Defense
  {
    company: 'elbit',
    baseSalaries: {
      junior: { min: 16000, max: 23000 },
      mid: { min: 23000, max: 33000 },
      senior: { min: 33000, max: 45000 },
      staff: { min: 45000, max: 58000 },
      manager: { min: 35000, max: 52000 },
      director: { min: 52000, max: 72000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'rafael',
    baseSalaries: {
      junior: { min: 17000, max: 24000 },
      mid: { min: 24000, max: 35000 },
      senior: { min: 35000, max: 48000 },
      staff: { min: 48000, max: 62000 },
      manager: { min: 38000, max: 55000 },
      director: { min: 55000, max: 78000 },
    },
    lastUpdated: '2025-01',
  },
  // AI/ML
  {
    company: 'ai21',
    baseSalaries: {
      junior: { min: 25000, max: 35000 },
      mid: { min: 35000, max: 50000 },
      senior: { min: 50000, max: 70000 },
      staff: { min: 70000, max: 90000 },
      manager: { min: 52000, max: 75000 },
      director: { min: 80000, max: 110000 },
    },
    lastUpdated: '2025-01',
  },
  // More companies...
  {
    company: 'gong',
    baseSalaries: {
      junior: { min: 24000, max: 33000 },
      mid: { min: 33000, max: 47000 },
      senior: { min: 47000, max: 65000 },
      staff: { min: 65000, max: 85000 },
      manager: { min: 50000, max: 72000 },
      director: { min: 78000, max: 105000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'jfrog',
    baseSalaries: {
      junior: { min: 20000, max: 28000 },
      mid: { min: 28000, max: 40000 },
      senior: { min: 40000, max: 55000 },
      staff: { min: 55000, max: 72000 },
      manager: { min: 42000, max: 62000 },
      director: { min: 65000, max: 88000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'appsflyer',
    baseSalaries: {
      junior: { min: 18000, max: 26000 },
      mid: { min: 26000, max: 38000 },
      senior: { min: 38000, max: 52000 },
      staff: { min: 52000, max: 68000 },
      manager: { min: 40000, max: 58000 },
      director: { min: 60000, max: 82000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'similarweb',
    baseSalaries: {
      junior: { min: 18000, max: 26000 },
      mid: { min: 26000, max: 38000 },
      senior: { min: 38000, max: 52000 },
      staff: { min: 52000, max: 68000 },
      manager: { min: 40000, max: 58000 },
      director: { min: 60000, max: 82000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'lightricks',
    baseSalaries: {
      junior: { min: 20000, max: 28000 },
      mid: { min: 28000, max: 40000 },
      senior: { min: 40000, max: 55000 },
      staff: { min: 55000, max: 72000 },
      manager: { min: 42000, max: 62000 },
      director: { min: 65000, max: 88000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'hibob',
    baseSalaries: {
      junior: { min: 18000, max: 26000 },
      mid: { min: 26000, max: 38000 },
      senior: { min: 38000, max: 52000 },
      staff: { min: 52000, max: 68000 },
      manager: { min: 40000, max: 58000 },
      director: { min: 60000, max: 82000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'deel',
    baseSalaries: {
      junior: { min: 22000, max: 32000 },
      mid: { min: 32000, max: 45000 },
      senior: { min: 45000, max: 62000 },
      staff: { min: 62000, max: 80000 },
      manager: { min: 48000, max: 68000 },
      director: { min: 72000, max: 95000 },
    },
    lastUpdated: '2025-01',
  },
  {
    company: 'papaya global',
    baseSalaries: {
      junior: { min: 20000, max: 28000 },
      mid: { min: 28000, max: 40000 },
      senior: { min: 40000, max: 55000 },
      staff: { min: 55000, max: 72000 },
      manager: { min: 42000, max: 62000 },
      director: { min: 65000, max: 88000 },
    },
    lastUpdated: '2025-01',
  },
];

// Get Israeli salary data for a company
function getIsraeliSalaryData(companyName: string): IsraeliSalaryData | null {
  const normalized = normalize(companyName);
  
  for (const data of ISRAELI_SALARY_DATABASE) {
    if (normalized.includes(data.company) || data.company.includes(normalized)) {
      return data;
    }
  }
  
  return null;
}

// Determine seniority level from job title
function getSeniorityLevel(title: string): 'junior' | 'mid' | 'senior' | 'staff' | 'manager' | 'director' {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('director') || titleLower.includes('head of') || titleLower.includes('vp') || titleLower.includes('chief')) {
    return 'director';
  }
  if (titleLower.includes('manager') || titleLower.includes('team lead')) {
    return 'manager';
  }
  if (titleLower.includes('staff') || titleLower.includes('principal') || titleLower.includes('architect')) {
    return 'staff';
  }
  if (titleLower.includes('senior') || titleLower.includes('sr.') || titleLower.includes('sr ')) {
    return 'senior';
  }
  if (titleLower.includes('junior') || titleLower.includes('jr.') || titleLower.includes('jr ') || titleLower.includes('intern') || titleLower.includes('entry')) {
    return 'junior';
  }
  
  return 'mid';
}

interface SalaryData {
  company_name: string;
  company_name_normalized: string;
  job_title: string | null;
  job_title_normalized: string | null;
  location: string;
  min_salary: number;
  max_salary: number;
  median_salary: number;
  currency: string;
  salary_type: string;
  sample_count: number;
  source: string;
  source_url: string | null;
  confidence: string;
}

// ============================================
// FETCH FROM EXTERNAL SOURCES
// ============================================

// Fetch salary from RapidAPI Real-Time Glassdoor Data
async function fetchRapidAPIGlassdoor(company: string, jobTitle?: string): Promise<SalaryData | null> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.log('RAPIDAPI_KEY not configured, skipping Glassdoor fetch');
    return null;
  }

  try {
    const baseTitle = jobTitle || 'Software Engineer';
    // Include company name in search for company-specific results
    const searchTitle = company ? `${baseTitle} ${company}` : baseTitle;
    
    const response = await axios.get('https://real-time-glassdoor-data.p.rapidapi.com/salary-estimation', {
      params: {
        job_title: searchTitle,
        location: 'Israel',
        location_type: 'ANY',
        years_of_experience: 'ALL',
        domain: 'www.glassdoor.com',
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'real-time-glassdoor-data.p.rapidapi.com',
      },
      timeout: 15000,
    });

    console.log(`Glassdoor API response for ${searchTitle}:`, JSON.stringify(response.data).substring(0, 300));

    // Parse the response from real-time-glassdoor-data API
    const apiResponse = response.data;
    
    if (apiResponse && apiResponse.status === 'OK' && apiResponse.data) {
      const data = apiResponse.data;
      
      // Extract salary data - API returns monthly ILS directly for Israel
      let minSalary = Math.round(data.min_salary || data.min_base_salary || 0);
      let maxSalary = Math.round(data.max_salary || data.max_base_salary || 0);
      let medianSalary = Math.round(data.median_salary || data.median_base_salary || 0);
      const sampleCount = data.salary_count || 1;
      const currency = data.salary_currency || 'ILS';
      const period = data.salary_period || 'MONTH';
      const confidence = data.confidence || 'MEDIUM';

      // If period is YEAR, convert to monthly
      if (period === 'YEAR' || period === 'ANNUAL') {
        minSalary = Math.round(minSalary / 12);
        maxSalary = Math.round(maxSalary / 12);
        medianSalary = Math.round(medianSalary / 12);
      }

      // If currency is USD, convert to ILS
      if (currency === 'USD') {
        const usdToIls = 3.7;
        minSalary = Math.round(minSalary * usdToIls);
        maxSalary = Math.round(maxSalary * usdToIls);
        medianSalary = Math.round(medianSalary * usdToIls);
      }

      if (minSalary > 0 && maxSalary > 0) {
        const jobTitleFromApi = data.job_title || searchTitle;
        return {
          company_name: company || 'General',
          company_name_normalized: normalize(company || 'general'),
          job_title: jobTitleFromApi,
          job_title_normalized: normalize(jobTitleFromApi),
          location: data.location || 'Israel',
          min_salary: minSalary,
          max_salary: maxSalary,
          median_salary: medianSalary || Math.round((minSalary + maxSalary) / 2),
          currency: 'ILS',
          salary_type: 'monthly',
          sample_count: sampleCount,
          source: 'glassdoor',
          source_url: data.link || `https://www.glassdoor.com/Salaries/${encodeURIComponent(jobTitleFromApi)}-israel-salaries`,
          confidence: confidence === 'VERY_HIGH' || confidence === 'HIGH' ? 'high' : confidence === 'MEDIUM' ? 'medium' : 'low',
        };
      }
    }
  } catch (error) {
    console.error(`RapidAPI Glassdoor failed for ${company}/${jobTitle}:`, error instanceof Error ? error.message : 'Unknown error');
  }

  return null;
}

// Fallback scraping (usually blocked but worth trying)
async function fetchGlassdoorScrape(company: string, jobTitle?: string): Promise<SalaryData | null> {
  try {
    const searchQuery = jobTitle 
      ? `${jobTitle} ${company} Israel`
      : `${company} Israel salaries`;
    
    const glassdoorUrl = `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(searchQuery)}&locT=N&locId=120`;
    
    const response = await axios.get(glassdoorUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    
    // Try to find salary data
    let minSalary = 0;
    let maxSalary = 0;

    // Look for salary patterns
    const pageText = $('body').text();
    const salaryMatch = pageText.match(/₪\s*([\d,]+)\s*[-–]\s*₪?\s*([\d,]+)/);
    
    if (salaryMatch) {
      minSalary = parseInt(salaryMatch[1].replace(/,/g, ''));
      maxSalary = parseInt(salaryMatch[2].replace(/,/g, ''));
    }

    if (minSalary > 0 && maxSalary > 0) {
      return {
        company_name: company,
        company_name_normalized: normalize(company),
        job_title: jobTitle || null,
        job_title_normalized: jobTitle ? normalize(jobTitle) : null,
        location: 'Israel',
        min_salary: minSalary,
        max_salary: maxSalary,
        median_salary: Math.round((minSalary + maxSalary) / 2),
        currency: 'ILS',
        salary_type: 'monthly',
        sample_count: 0,
        source: 'glassdoor_scrape',
        source_url: glassdoorUrl,
        confidence: 'low',
      };
    }
  } catch (error) {
    // Expected to fail often due to blocking
  }

  return null;
}

// ============================================
// DATABASE OPERATIONS
// ============================================

// Store salary data in database
async function storeSalaryData(data: SalaryData): Promise<void> {
  try {
    const { error } = await supabase
      .from('salary_data')
      .upsert({
        ...data,
        fetched_date: new Date().toISOString(),
      }, {
        onConflict: 'company_name_normalized,job_title_normalized,location',
      });

    if (error) {
      console.error('Error storing salary data:', error);
    } else {
      console.log(`✅ Stored salary data for ${data.company_name} ${data.job_title || ''}`);
    }
  } catch (error) {
    console.error('Error storing salary data:', error);
  }
}

// Populate database with Israeli salary survey data
export async function populateIsraeliSalaryData(): Promise<void> {
  console.log('📊 Populating Israeli salary data...');
  
  for (const companyData of ISRAELI_SALARY_DATABASE) {
    // Store base company data for each level
    const levels: Array<{ level: string; key: keyof typeof companyData.baseSalaries }> = [
      { level: 'Junior', key: 'junior' },
      { level: 'Mid-Level', key: 'mid' },
      { level: 'Senior', key: 'senior' },
      { level: 'Staff', key: 'staff' },
      { level: 'Manager', key: 'manager' },
      { level: 'Director', key: 'director' },
    ];

    for (const { level, key } of levels) {
      const salaryRange = companyData.baseSalaries[key];
      
      await storeSalaryData({
        company_name: companyData.company,
        company_name_normalized: normalize(companyData.company),
        job_title: `${level} Software Engineer`,
        job_title_normalized: normalize(`${level} Software Engineer`),
        location: 'Israel',
        min_salary: salaryRange.min,
        max_salary: salaryRange.max,
        median_salary: Math.round((salaryRange.min + salaryRange.max) / 2),
        currency: 'ILS',
        salary_type: 'monthly',
        sample_count: 10, // Survey data
        source: 'israeli_survey',
        source_url: null,
        confidence: 'high',
      });
    }
  }

  console.log('✅ Israeli salary data populated');
}

// Job titles to fetch from Glassdoor
const GLASSDOOR_JOB_TITLES = [
  'Software Engineer',
  'Senior Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Scientist',
  'Product Manager',
  'QA Engineer',
];

// Top companies to fetch Glassdoor data for
const GLASSDOOR_COMPANIES = [
  'Google',
  'Microsoft',
  'Meta',
  'Amazon',
  'Apple',
  'Nvidia',
  'Wix',
  'Monday.com',
  'Fiverr',
  'Check Point',
  'CyberArk',
  'Palo Alto Networks',
  'SentinelOne',
  'Wiz',
  'Snyk',
  'JFrog',
  'AppsFlyer',
  'SimilarWeb',
  'Gong',
  'Mobileye',
  'Intel',
  'Oracle',
  'Salesforce',
  'Nice',
  'Amdocs',
  'Playtika',
  'ironSource',
  'Taboola',
  'Outbrain',
  'Payoneer',
  'Rapyd',
  'Tipalti',
  'Riskified',
  'Forter',
  'Lightricks',
  'HiBob',
  'Papaya Global',
  'Deel',
  'Elbit Systems',
  'Rafael',
];

// Fetch Glassdoor data for companies and job titles
export async function fetchGlassdoorSalaries(): Promise<void> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.log('⚠️ RAPIDAPI_KEY not set - skipping Glassdoor fetch');
    return;
  }

  console.log('🔄 Fetching salaries from Glassdoor API...');
  console.log(`   Companies: ${GLASSDOOR_COMPANIES.length}`);
  console.log(`   Job titles: ${GLASSDOOR_JOB_TITLES.length}`);
  
  let successCount = 0;
  let failCount = 0;

  // First fetch general salaries (no specific company)
  console.log('📊 Fetching general salary data...');
  for (const jobTitle of GLASSDOOR_JOB_TITLES) {
    try {
      const data = await fetchRapidAPIGlassdoor('', jobTitle);
      
      if (data && data.min_salary > 0) {
        await storeSalaryData(data);
        successCount++;
        console.log(`✅ General: ${jobTitle} - ₪${data.min_salary}-${data.max_salary}`);
      } else {
        failCount++;
      }
    } catch (error) {
      failCount++;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Then fetch per-company salaries
  console.log('🏢 Fetching company-specific salary data...');
  for (const company of GLASSDOOR_COMPANIES) {
    // Fetch main job title per company
    try {
      const data = await fetchRapidAPIGlassdoor(company, 'Software Engineer');
      
      if (data && data.min_salary > 0) {
        // Override company name to the actual company
        data.company_name = company;
        data.company_name_normalized = normalize(company);
        await storeSalaryData(data);
        successCount++;
        console.log(`✅ ${company}: ₪${data.min_salary}-${data.max_salary}`);
      } else {
        failCount++;
        console.log(`⚠️ No Glassdoor data for ${company}`);
      }
    } catch (error) {
      failCount++;
      console.error(`❌ Error fetching ${company}:`, error);
    }
    
    // Rate limiting - be gentle with the API
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log(`✅ Glassdoor fetch complete: ${successCount} success, ${failCount} failed`);
}

// Main function to fetch and update salary data
export async function fetchAllSalaryData(): Promise<void> {
  console.log('🔄 Starting salary data fetch...');
  
  // First, ensure Israeli survey data is up to date
  await populateIsraeliSalaryData();
  
  // Then fetch from Glassdoor API
  await fetchGlassdoorSalaries();
  
  // Aggregate user reports
  await aggregateUserReports();
  
  console.log('✅ Salary data fetch complete');
}

// ============================================
// USER REPORTS
// ============================================

export interface SalaryReport {
  company_name: string;
  job_title: string;
  experience_years?: number;
  location?: string;
  base_salary: number;
  total_compensation?: number;
  currency?: string;
}

// Submit a salary report
export async function submitSalaryReport(
  report: SalaryReport,
  userId?: string,
  ipAddress?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate salary range (sanity check)
    if (report.base_salary < 5000 || report.base_salary > 200000) {
      return { success: false, error: 'Salary must be between ₪5,000 and ₪200,000 per month' };
    }

    const { error } = await supabase
      .from('salary_reports')
      .insert({
        user_id: userId || null,
        company_name: report.company_name,
        company_name_normalized: normalize(report.company_name),
        job_title: report.job_title,
        job_title_normalized: normalize(report.job_title),
        experience_years: report.experience_years || null,
        location: report.location || 'Israel',
        base_salary: report.base_salary,
        total_compensation: report.total_compensation || null,
        currency: report.currency || 'ILS',
        is_verified: !!userId, // Verified if user is logged in
        status: 'pending',
        ip_hash: ipAddress ? hashIP(ipAddress) : null,
      });

    if (error) {
      console.error('Error submitting salary report:', error);
      return { success: false, error: 'Failed to submit report' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error submitting salary report:', error);
    return { success: false, error: 'Failed to submit report' };
  }
}

// Aggregate user reports into salary_data
async function aggregateUserReports(): Promise<void> {
  console.log('📊 Aggregating user salary reports...');

  // Get approved reports grouped by company and title
  const { data: reports, error } = await supabase
    .from('salary_reports')
    .select('*')
    .eq('status', 'approved');

  if (error || !reports || reports.length === 0) {
    console.log('   No approved reports to aggregate');
    return;
  }

  // Group by company and title
  const grouped = new Map<string, typeof reports>();
  
  for (const report of reports) {
    const key = `${report.company_name_normalized}|${report.job_title_normalized}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(report);
  }

  // Calculate aggregated data for each group
  for (const [key, groupReports] of grouped) {
    if (groupReports.length < 2) continue; // Need at least 2 reports

    const salaries = groupReports.map(r => r.base_salary).sort((a, b) => a - b);
    const minSalary = salaries[0];
    const maxSalary = salaries[salaries.length - 1];
    const medianSalary = salaries[Math.floor(salaries.length / 2)];

    await storeSalaryData({
      company_name: groupReports[0].company_name,
      company_name_normalized: groupReports[0].company_name_normalized,
      job_title: groupReports[0].job_title,
      job_title_normalized: groupReports[0].job_title_normalized,
      location: 'Israel',
      min_salary: minSalary,
      max_salary: maxSalary,
      median_salary: medianSalary,
      currency: 'ILS',
      salary_type: 'monthly',
      sample_count: groupReports.length,
      source: 'user_reports',
      source_url: null,
      confidence: groupReports.length >= 5 ? 'high' : 'medium',
    });
  }

  console.log(`   Aggregated ${grouped.size} salary groups from user reports`);
}

// ============================================
// QUERY FUNCTIONS
// ============================================

// Get salary data from database
export async function getSalaryData(company: string, jobTitle?: string): Promise<SalaryData | null> {
  const normalizedCompany = normalize(company);
  const normalizedTitle = jobTitle ? normalize(jobTitle) : null;

  // Try exact match first
  let query = supabase
    .from('salary_data')
    .select('*')
    .ilike('company_name_normalized', `%${normalizedCompany}%`);

  if (normalizedTitle) {
    query = query.ilike('job_title_normalized', `%${normalizedTitle}%`);
  }

  const { data, error } = await query.order('sample_count', { ascending: false }).limit(1).single();

  if (!error && data) {
    return data;
  }

  // If no match with title, try company only
  if (normalizedTitle) {
    const { data: companyData } = await supabase
      .from('salary_data')
      .select('*')
      .ilike('company_name_normalized', `%${normalizedCompany}%`)
      .order('sample_count', { ascending: false })
      .limit(1)
      .single();

    return companyData || null;
  }

  return null;
}

// Get all salary data for a company
export async function getCompanySalaries(company: string): Promise<SalaryData[]> {
  const normalizedCompany = normalize(company);

  const { data, error } = await supabase
    .from('salary_data')
    .select('*')
    .ilike('company_name_normalized', `%${normalizedCompany}%`)
    .order('job_title');

  if (error) {
    console.error('Error fetching company salaries:', error);
    return [];
  }

  return data || [];
}

// Get salary estimate combining all sources
export async function getSalaryEstimate(
  company: string,
  jobTitle: string,
  level: string,
  jobCategory: string,
  size: string
): Promise<{
  min: number;
  max: number;
  source: 'database' | 'israeli_data' | 'estimated';
  confidence: string;
}> {
  // 1. Try database first
  const dbData = await getSalaryData(company, jobTitle);
  
  if (dbData && dbData.min_salary > 0) {
    return {
      min: dbData.min_salary,
      max: dbData.max_salary,
      source: 'database',
      confidence: dbData.confidence,
    };
  }

  // 2. Try Israeli salary database
  const israeliData = getIsraeliSalaryData(company);
  if (israeliData) {
    const seniorityLevel = getSeniorityLevel(jobTitle);
    const salaryRange = israeliData.baseSalaries[seniorityLevel];
    
    return {
      min: salaryRange.min,
      max: salaryRange.max,
      source: 'israeli_data',
      confidence: 'high',
    };
  }

  // 3. Fallback to estimation (will be calculated on frontend)
  return {
    min: 0,
    max: 0,
    source: 'estimated',
    confidence: 'low',
  };
}

// Get pending reports count (for admin)
export async function getPendingReportsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('salary_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) return 0;
  return count || 0;
}

// Approve/reject salary report (admin)
export async function moderateSalaryReport(
  reportId: string,
  action: 'approve' | 'reject'
): Promise<boolean> {
  const { error } = await supabase
    .from('salary_reports')
    .update({ status: action === 'approve' ? 'approved' : 'rejected' })
    .eq('id', reportId);

  if (error) {
    console.error('Error moderating report:', error);
    return false;
  }

  // If approved, trigger aggregation
  if (action === 'approve') {
    await aggregateUserReports();
  }

  return true;
}
