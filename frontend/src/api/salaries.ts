// API client for salary data

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface SalaryDataResponse {
  company_name: string;
  job_title: string | null;
  min_salary: number;
  max_salary: number;
  median_salary: number;
  currency: string;
  salary_type: string;
  source: string;
  confidence: string;
  fetched_date: string;
}

export interface SalaryEstimateResponse {
  min: number;
  max: number;
  source: 'database' | 'estimated';
  confidence: string;
}

export interface BatchEstimateJob {
  company: string;
  title: string;
  level?: string;
  category?: string;
  size?: string;
}

export interface BatchEstimateResponse {
  estimates: Array<{
    company: string;
    title: string;
    min: number;
    max: number;
    source: 'database' | 'estimated';
    confidence: string;
  }>;
}

// Cache for salary data to avoid repeated API calls
const salaryCache = new Map<string, SalaryEstimateResponse>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

function getCacheKey(company: string, title: string): string {
  return `${company.toLowerCase()}-${title.toLowerCase()}`;
}

// Get salary estimate for a single job
export async function getSalaryEstimate(
  company: string,
  title: string,
  level?: string,
  category?: string,
  size?: string
): Promise<SalaryEstimateResponse | null> {
  const cacheKey = getCacheKey(company, title);
  
  // Check cache
  const cachedTime = cacheTimestamps.get(cacheKey);
  if (cachedTime && Date.now() - cachedTime < CACHE_TTL) {
    const cached = salaryCache.get(cacheKey);
    if (cached) return cached;
  }

  try {
    const response = await fetch(`${API_BASE}/api/salaries/estimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ company, title, level, category, size }),
    });

    if (!response.ok) {
      return null;
    }

    const data: SalaryEstimateResponse = await response.json();
    
    // Cache the result
    salaryCache.set(cacheKey, data);
    cacheTimestamps.set(cacheKey, Date.now());
    
    return data;
  } catch (error) {
    console.error('Failed to fetch salary estimate:', error);
    return null;
  }
}

// Get batch salary estimates
export async function getBatchSalaryEstimates(
  jobs: BatchEstimateJob[]
): Promise<BatchEstimateResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/api/salaries/batch-estimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobs }),
    });

    if (!response.ok) {
      return null;
    }

    const data: BatchEstimateResponse = await response.json();
    
    // Cache individual results
    data.estimates.forEach(estimate => {
      const cacheKey = getCacheKey(estimate.company, estimate.title);
      salaryCache.set(cacheKey, {
        min: estimate.min,
        max: estimate.max,
        source: estimate.source,
        confidence: estimate.confidence,
      });
      cacheTimestamps.set(cacheKey, Date.now());
    });
    
    return data;
  } catch (error) {
    console.error('Failed to fetch batch salary estimates:', error);
    return null;
  }
}

// Get salary data for a company
export async function getCompanySalaries(company: string): Promise<SalaryDataResponse[]> {
  try {
    const response = await fetch(`${API_BASE}/api/salaries/company/${encodeURIComponent(company)}`);
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.salaries || [];
  } catch (error) {
    console.error('Failed to fetch company salaries:', error);
    return [];
  }
}

// Get salary stats
export async function getSalaryStats(): Promise<{
  total_entries: number;
  unique_companies: number;
  by_source: { israeli_survey: number; user_reports: number; glassdoor: number };
  last_fetch: string | null;
} | null> {
  try {
    const response = await fetch(`${API_BASE}/api/salaries/stats`);
    
    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch salary stats:', error);
    return null;
  }
}

// Salary report submission
export interface SalaryReportInput {
  company_name: string;
  job_title: string;
  experience_years?: number;
  location?: string;
  base_salary: number;
  total_compensation?: number;
}

export interface SalaryReportResponse {
  success: boolean;
  message?: string;
  error?: string;
  verified?: boolean;
}

// Submit a salary report
export async function submitSalaryReport(
  report: SalaryReportInput
): Promise<SalaryReportResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/salaries/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for auth
      body: JSON.stringify(report),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to submit report' };
    }

    return data;
  } catch (error) {
    console.error('Failed to submit salary report:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}
