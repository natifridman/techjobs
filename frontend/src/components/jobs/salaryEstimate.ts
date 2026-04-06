import type { Job } from './jobsData';
import { getSalaryEstimate as fetchSalaryEstimate, type SalaryEstimateResponse } from '@/api/salaries';

/**
 * Israeli Tech Salary Estimation Module
 * 
 * DATA SOURCES (Official):
 * - Israel Innovation Authority 2025 Report: Average tech salary ₪32,300/month
 *   https://innovationisrael.org.il/en/reports/
 * - Central Bureau of Statistics (CBS) Dec 2024: Tech sector average ₪29,736/month
 *   https://www.cbs.gov.il/
 * - GotFriends Salary Survey Jan 2026: Average tech salary ₪40,000/month
 *   https://www.geektime.co.il/tech-salary-survey-jan-2026/
 * - Ethosia 2023 Survey: Average tech salary ₪30,800/month
 *   https://www.ethosia.co.il/salary-survey/
 * 
 * DISCLAIMER: These are estimates based on aggregated market data.
 * Actual salaries may vary based on specific role, company, negotiation, and other factors.
 * For accurate data, consult official surveys and Glassdoor.
 */

// Cache for API results
const apiSalaryCache = new Map<string, SalaryEstimateResponse | null>();
const apiCacheTimestamps = new Map<string, number>();
const API_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface SalaryRange {
  min: number;
  max: number;
}

/**
 * Base salary ranges by level (monthly ILS)
 * Based on Israel Innovation Authority 2025 and GotFriends 2026 surveys
 * Average tech salary: ₪32,300-40,000/month (mid-level)
 */
const levelSalaryRanges: Record<string, SalaryRange> = {
  'Intern': { min: 6000, max: 12000 },      // Student/intern positions
  'Engineer': { min: 20000, max: 40000 },   // Mid-level (aligns with ₪32K average)
  'Manager': { min: 38000, max: 60000 },    // Team leads, managers
  'Executive': { min: 55000, max: 100000 }, // Directors, VPs, C-level
};

/**
 * Category multipliers based on market demand
 * Source: Ethosia & GotFriends surveys breakdown by role
 */
const categoryMultipliers: Record<string, number> = {
  'software': 1.1,           // Core R&D - high demand
  'frontend': 1.05,          // Frontend development
  'data-science': 1.2,       // Data/ML - premium skills
  'devops': 1.15,            // DevOps/SRE - high demand
  'security': 1.2,           // Cybersecurity - premium in Israel
  'product': 1.1,            // Product management
  'design': 0.95,            // UX/UI design
  'qa': 0.9,                 // QA/Testing
  'hr': 0.85,                // HR/People
  'marketing': 0.9,          // Marketing
  'sales': 0.95,             // Sales
  'finance': 1.0,            // Finance
  'legal': 1.0,              // Legal
  'support': 0.8,            // Customer support
  'admin': 0.75,             // Administration
  'business': 1.0,           // Business development
  'hardware': 1.1,           // Hardware engineering
  'procurement-operations': 0.85,
  'project-management': 0.95,
};

/**
 * Title-based adjustments for seniority
 * Based on typical Israeli market progression
 */
function getTitleMultiplier(title: string): number {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('senior') || titleLower.includes('sr.')) {
    return 1.3;  // Senior: ~₪40-52K
  }
  if (titleLower.includes('staff') || titleLower.includes('principal')) {
    return 1.5;  // Staff/Principal: ~₪48-60K
  }
  if (titleLower.includes('lead') || titleLower.includes('tech lead')) {
    return 1.4;  // Lead: ~₪45-56K
  }
  if (titleLower.includes('director')) {
    return 1.6;  // Director: ~₪55-70K
  }
  if (titleLower.includes('head of') || titleLower.includes('vp')) {
    return 1.8;  // VP/Head: ~₪65-80K
  }
  if (titleLower.includes('junior') || titleLower.includes('jr.')) {
    return 0.75; // Junior: ~₪15-25K
  }
  
  return 1.0;
}

/**
 * Company size adjustments
 * Based on Zviran PayData and market research
 * Larger companies typically pay 10-15% more base salary
 */
const sizeMultipliers: Record<string, number> = {
  'xs': 0.85,  // 1-10 employees - early startups
  's': 0.9,    // 11-50 employees - growth startups
  'm': 1.0,    // 51-200 employees - mid-size
  'l': 1.1,    // 201-1000 employees - established
  'xl': 1.15,  // 1001+ employees - enterprise
};

/**
 * Company-specific pay tier multipliers
 * Based on Glassdoor Israel data, public salary reports, and market reputation
 * 
 * Tiers:
 * - Top (1.4-1.6x): FAANG, top-paying unicorns
 * - High (1.2-1.4x): Well-funded tech companies
 * - Mid (1.05-1.2x): Established Israeli tech
 * - Standard (0.95-1.05x): Average market rate
 * - Below (<0.95x): Services, consulting
 */
const companyMultipliers: Record<string, number> = {
  // === TOP TIER (1.4-1.6x) - FAANG & Top Unicorns ===
  'google': 1.55,
  'meta': 1.5,
  'facebook': 1.5,
  'apple': 1.5,
  'amazon': 1.4,
  'microsoft': 1.45,
  'nvidia': 1.55,
  'netflix': 1.5,
  'openai': 1.6,
  'anthropic': 1.55,
  'wiz': 1.45,           // Israeli unicorn, known for high comp
  
  // === HIGH TIER (1.2-1.4x) - Well-funded Tech ===
  'monday.com': 1.35,
  'monday': 1.35,
  'snyk': 1.35,
  'datadog': 1.4,
  'cloudflare': 1.35,
  'stripe': 1.45,
  'salesforce': 1.3,
  'adobe': 1.3,
  'intel': 1.25,
  'qualcomm': 1.3,
  'mobileye': 1.35,
  'palo alto networks': 1.35,
  'palo alto': 1.35,
  'crowdstrike': 1.35,
  'orca security': 1.35,
  'orca': 1.35,
  'gong': 1.35,
  'deel': 1.3,
  'rippling': 1.35,
  'sentinelone': 1.3,
  'zscaler': 1.3,
  'armis': 1.3,
  'axonius': 1.3,
  'mellanox': 1.3,
  'pagaya': 1.3,
  
  // === MID-HIGH TIER (1.15-1.25x) ===
  'wix': 1.25,
  'fiverr': 1.25,
  'check point': 1.25,
  'checkpoint': 1.25,
  'cyberark': 1.25,
  'jfrog': 1.25,
  'lightricks': 1.25,
  'papaya global': 1.25,
  'papaya': 1.25,
  'rapyd': 1.25,
  'cato networks': 1.25,
  'cato': 1.25,
  'ironsource': 1.25,
  'unity': 1.25,
  'broadcom': 1.25,
  'oracle': 1.2,
  'vmware': 1.2,
  'cisco': 1.2,
  'tower semiconductor': 1.2,
  'tower': 1.2,
  'similarweb': 1.2,
  'playtika': 1.2,
  'payoneer': 1.2,
  'varonis': 1.2,
  'nice': 1.2,
  'tipalti': 1.2,
  'appsflyer': 1.2,
  'walkme': 1.2,
  'hibob': 1.2,
  'bob': 1.2,
  'riskified': 1.2,
  'forter': 1.2,
  'rafael': 1.2,
  
  // === MID TIER (1.05-1.15x) ===
  'ibm': 1.15,
  'amdocs': 1.15,
  'elbit': 1.15,
  'elbit systems': 1.15,
  'iai': 1.15,
  'israel aerospace': 1.15,
  'infinidat': 1.15,
  'cellebrite': 1.15,
  'outbrain': 1.15,
  'taboola': 1.15,
  'yotpo': 1.15,
  'mckinsey': 1.15,
  'audiocodes': 1.1,
  'radware': 1.1,
  'kaltura': 1.1,
  'liveperson': 1.1,
  'sapiens': 1.1,
  'bcg': 1.1,
  'bain': 1.1,
  'allot': 1.05,
  'gilat': 1.05,
  'magic software': 1.05,
  
  // === STANDARD (0.95-1.0x) ===
  'matrix': 1.0,
  'ness': 1.0,
  'accenture': 1.0,
  'deloitte': 0.95,
  'kpmg': 0.95,
  'pwc': 0.95,
  'ernst & young': 0.95,
  'ey': 0.95,
};

/**
 * Find company multiplier (case-insensitive, partial match)
 */
function getCompanyMultiplier(companyName: string): number {
  const companyLower = companyName.toLowerCase().trim();
  
  // Direct match
  if (companyMultipliers[companyLower]) {
    return companyMultipliers[companyLower];
  }
  
  // Partial match
  for (const [knownCompany, multiplier] of Object.entries(companyMultipliers)) {
    if (companyLower.includes(knownCompany) || knownCompany.includes(companyLower)) {
      return multiplier;
    }
  }
  
  return 1.0;
}

export interface SalaryEstimate {
  minMonthly: number;
  maxMonthly: number;
  minAnnual: number;
  maxAnnual: number;
  currency: string;
  confidence: 'low' | 'medium' | 'high';
}

/**
 * Estimate salary based on job attributes
 * Uses official Israeli market data as baseline
 */
export function estimateSalary(job: Job): SalaryEstimate {
  const baseRange = levelSalaryRanges[job.level] || levelSalaryRanges['Engineer'];
  const categoryMult = categoryMultipliers[job.job_category] || 1.0;
  const titleMult = getTitleMultiplier(job.title);
  const sizeMult = sizeMultipliers[job.size] || 1.0;
  const companyMult = getCompanyMultiplier(job.company);
  
  const totalMult = categoryMult * titleMult * sizeMult * companyMult;
  
  const minMonthly = Math.round(baseRange.min * totalMult / 1000) * 1000;
  const maxMonthly = Math.round(baseRange.max * totalMult / 1000) * 1000;
  
  // Confidence based on data completeness
  let confidence: 'low' | 'medium' | 'high' = 'medium';
  if (job.level && job.job_category && job.size) {
    confidence = 'high';
  } else if (!job.level && !job.job_category) {
    confidence = 'low';
  }
  
  if (companyMult !== 1.0 && confidence === 'medium') {
    confidence = 'high';
  }
  
  return {
    minMonthly,
    maxMonthly,
    minAnnual: minMonthly * 12,
    maxAnnual: maxMonthly * 12,
    currency: '₪',
    confidence,
  };
}

export function formatSalaryRange(estimate: SalaryEstimate): string {
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${Math.round(num / 1000)}K`;
    }
    return num.toLocaleString();
  };
  
  return `${estimate.currency}${formatNumber(estimate.minMonthly)} - ${estimate.currency}${formatNumber(estimate.maxMonthly)}/mo`;
}

export function formatAnnualSalary(estimate: SalaryEstimate): string {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${Math.round(num / 1000)}K`;
    }
    return num.toLocaleString();
  };
  
  return `${estimate.currency}${formatNumber(estimate.minAnnual)} - ${estimate.currency}${formatNumber(estimate.maxAnnual)}/yr`;
}

export function generateGlassdoorUrl(job: Job): string {
  const searchQuery = encodeURIComponent(`${job.title} ${job.company}`);
  return `https://www.glassdoor.com/Search/results.htm?keyword=${searchQuery}&locT=N&locId=120`;
}

export function hasCompanyData(companyName: string): boolean {
  return getCompanyMultiplier(companyName) !== 1.0;
}

export function getCompanyTier(companyName: string): 'top' | 'high' | 'mid' | 'standard' | 'below' {
  const mult = getCompanyMultiplier(companyName);
  if (mult >= 1.4) return 'top';
  if (mult >= 1.2) return 'high';
  if (mult >= 1.05) return 'mid';
  if (mult >= 0.95) return 'standard';
  return 'below';
}

// Official data sources for reference
export const SALARY_DATA_SOURCES = [
  {
    name: 'Israel Innovation Authority',
    year: 2025,
    url: 'https://innovationisrael.org.il/en/reports/',
    avgSalary: 32300,
  },
  {
    name: 'Central Bureau of Statistics (CBS)',
    year: 2024,
    url: 'https://www.cbs.gov.il/',
    avgSalary: 29736,
  },
  {
    name: 'GotFriends Survey',
    year: 2026,
    url: 'https://www.geektime.co.il/tech-salary-survey-jan-2026/',
    avgSalary: 40000,
  },
  {
    name: 'Ethosia Survey',
    year: 2023,
    url: 'https://www.ethosia.co.il/salary-survey/',
    avgSalary: 30800,
  },
];

// Fetch salary from API (with caching)
export async function fetchApiSalary(job: Job): Promise<SalaryEstimate | null> {
  const cacheKey = `${job.company.toLowerCase()}-${job.title.toLowerCase()}`;
  
  const cachedTime = apiCacheTimestamps.get(cacheKey);
  if (cachedTime && Date.now() - cachedTime < API_CACHE_TTL) {
    const cached = apiSalaryCache.get(cacheKey);
    if (cached && cached.min > 0) {
      return {
        minMonthly: cached.min,
        maxMonthly: cached.max,
        minAnnual: cached.min * 12,
        maxAnnual: cached.max * 12,
        currency: '₪',
        confidence: cached.confidence as 'low' | 'medium' | 'high',
      };
    }
  }

  try {
    const result = await fetchSalaryEstimate(
      job.company,
      job.title,
      job.level,
      job.job_category,
      job.size
    );

    apiSalaryCache.set(cacheKey, result);
    apiCacheTimestamps.set(cacheKey, Date.now());

    if (result && result.min > 0) {
      return {
        minMonthly: result.min,
        maxMonthly: result.max,
        minAnnual: result.min * 12,
        maxAnnual: result.max * 12,
        currency: '₪',
        confidence: result.confidence as 'low' | 'medium' | 'high',
      };
    }
  } catch (error) {
    console.error('Failed to fetch API salary:', error);
  }

  return null;
}

export function hasApiSalaryData(job: Job): boolean {
  const cacheKey = `${job.company.toLowerCase()}-${job.title.toLowerCase()}`;
  const cached = apiSalaryCache.get(cacheKey);
  return cached !== undefined && cached !== null && cached.min > 0 && cached.source === 'database';
}
