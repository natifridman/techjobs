import { Router, Request, Response } from 'express';
import { 
  getSalaryData, 
  getCompanySalaries, 
  getSalaryEstimate, 
  fetchAllSalaryData,
  submitSalaryReport,
  getPendingReportsCount,
  moderateSalaryReport,
  populateIsraeliSalaryData,
  fetchGlassdoorSalaries,
  type SalaryReport
} from '../services/salaryFetcher';
import { populateAllCompanySalaries } from '../services/companyDataPopulator';

const router = Router();

// Get salary data for a specific company and optional job title
router.get('/lookup', async (req: Request, res: Response) => {
  try {
    const { company, title } = req.query;
    
    if (!company || typeof company !== 'string') {
      res.status(400).json({ error: 'Company name is required' });
      return;
    }

    const titleStr = typeof title === 'string' ? title : undefined;
    const salaryData = await getSalaryData(company, titleStr);
    
    if (!salaryData) {
      res.status(404).json({ error: 'No salary data found', company, title: titleStr });
      return;
    }

    res.json(salaryData);
  } catch (error) {
    console.error('Error looking up salary:', error);
    res.status(500).json({ error: 'Failed to lookup salary data' });
  }
});

// Get all salary data for a company
router.get('/company/:company', async (req: Request, res: Response) => {
  try {
    const { company } = req.params;
    const salaries = await getCompanySalaries(company);
    
    res.json({
      company,
      salaries,
      count: salaries.length,
    });
  } catch (error) {
    console.error('Error fetching company salaries:', error);
    res.status(500).json({ error: 'Failed to fetch company salaries' });
  }
});

// Get salary estimate for a job
router.post('/estimate', async (req: Request, res: Response) => {
  try {
    const { company, title, level, category, size } = req.body;
    
    if (!company || !title) {
      res.status(400).json({ error: 'Company and title are required' });
      return;
    }

    const estimate = await getSalaryEstimate(
      company,
      title,
      level || 'Engineer',
      category || 'software',
      size || 'm'
    );
    
    res.json(estimate);
  } catch (error) {
    console.error('Error getting salary estimate:', error);
    res.status(500).json({ error: 'Failed to get salary estimate' });
  }
});

// Batch salary estimates for multiple jobs
router.post('/batch-estimate', async (req: Request, res: Response) => {
  try {
    const { jobs } = req.body;
    
    if (!Array.isArray(jobs)) {
      res.status(400).json({ error: 'Jobs array is required' });
      return;
    }

    const estimates = await Promise.all(
      jobs.map(async (job: { company: string; title: string; level?: string; category?: string; size?: string }) => {
        const estimate = await getSalaryEstimate(
          job.company,
          job.title,
          job.level || 'Engineer',
          job.category || 'software',
          job.size || 'm'
        );
        return {
          company: job.company,
          title: job.title,
          ...estimate,
        };
      })
    );
    
    res.json({ estimates });
  } catch (error) {
    console.error('Error getting batch salary estimates:', error);
    res.status(500).json({ error: 'Failed to get salary estimates' });
  }
});

// ============================================
// USER SALARY REPORTS
// ============================================

// Submit a salary report
router.post('/report', async (req: Request, res: Response) => {
  try {
    const { company_name, job_title, experience_years, location, base_salary, total_compensation } = req.body;
    
    if (!company_name || !job_title || !base_salary) {
      res.status(400).json({ error: 'Company name, job title, and base salary are required' });
      return;
    }

    const report: SalaryReport = {
      company_name,
      job_title,
      experience_years,
      location,
      base_salary: parseInt(base_salary),
      total_compensation: total_compensation ? parseInt(total_compensation) : undefined,
    };

    // Get user ID if logged in
    const userId = (req.user as { id?: string })?.id;
    
    // Get IP for spam prevention
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';

    const result = await submitSalaryReport(report, userId, ip);
    
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ 
      success: true, 
      message: 'Thank you! Your salary report has been submitted and will be reviewed.',
      verified: !!userId
    });
  } catch (error) {
    console.error('Error submitting salary report:', error);
    res.status(500).json({ error: 'Failed to submit salary report' });
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Debug endpoint to check if ADMIN_KEY is configured
router.get('/admin/check', async (req: Request, res: Response) => {
  const adminKey = req.headers['x-admin-key'];
  const envKeySet = !!process.env.ADMIN_KEY;
  const envKeyLength = process.env.ADMIN_KEY?.length || 0;
  const headerKeyLength = typeof adminKey === 'string' ? adminKey.length : 0;
  
  res.json({
    admin_key_configured: envKeySet,
    env_key_length: envKeyLength,
    header_key_length: headerKeyLength,
    keys_match: adminKey === process.env.ADMIN_KEY,
  });
});

// Manual trigger to refresh salary data (admin only)
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Run fetch in background
    fetchAllSalaryData().catch(console.error);
    
    res.json({ message: 'Salary data refresh started in background' });
  } catch (error) {
    console.error('Error refreshing salary data:', error);
    res.status(500).json({ error: 'Failed to start salary refresh' });
  }
});

// Populate Israeli salary data (admin only)
router.post('/populate-israeli', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await populateIsraeliSalaryData();
    
    res.json({ message: 'Israeli salary data populated successfully' });
  } catch (error) {
    console.error('Error populating Israeli salary data:', error);
    res.status(500).json({ error: 'Failed to populate Israeli salary data' });
  }
});

// Fetch salaries from Glassdoor API (admin only)
router.post('/fetch-glassdoor', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!process.env.RAPIDAPI_KEY) {
      res.status(400).json({ error: 'RAPIDAPI_KEY not configured' });
      return;
    }

    // Run fetch in background
    fetchGlassdoorSalaries().catch(console.error);
    
    res.json({ message: 'Glassdoor salary fetch started in background' });
  } catch (error) {
    console.error('Error fetching Glassdoor salaries:', error);
    res.status(500).json({ error: 'Failed to start Glassdoor fetch' });
  }
});

// Populate salary estimates for all companies from job listings (admin only)
router.post('/populate-all-companies', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // This can take a while, so run in background
    populateAllCompanySalaries()
      .then(result => console.log('Company population result:', result))
      .catch(console.error);
    
    res.json({ message: 'Company salary population started in background' });
  } catch (error) {
    console.error('Error populating company salaries:', error);
    res.status(500).json({ error: 'Failed to start company salary population' });
  }
});

// Get pending reports count (admin)
router.get('/admin/pending-count', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const count = await getPendingReportsCount();
    res.json({ pending_count: count });
  } catch (error) {
    console.error('Error getting pending count:', error);
    res.status(500).json({ error: 'Failed to get pending count' });
  }
});

// Moderate a salary report (admin)
router.post('/admin/moderate/:reportId', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { reportId } = req.params;
    const { action } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      res.status(400).json({ error: 'Action must be "approve" or "reject"' });
      return;
    }

    const success = await moderateSalaryReport(reportId, action);
    
    if (!success) {
      res.status(500).json({ error: 'Failed to moderate report' });
      return;
    }

    res.json({ success: true, message: `Report ${action}d successfully` });
  } catch (error) {
    console.error('Error moderating report:', error);
    res.status(500).json({ error: 'Failed to moderate report' });
  }
});

// Get stats about salary data
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    );

    // Get counts by source
    const { count: totalCount } = await supabase
      .from('salary_data')
      .select('*', { count: 'exact', head: true });

    const { count: israeliCount } = await supabase
      .from('salary_data')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'israeli_survey');

    const { count: userReportsCount } = await supabase
      .from('salary_data')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'user_reports');

    const { count: glassdoorCount } = await supabase
      .from('salary_data')
      .select('*', { count: 'exact', head: true })
      .in('source', ['glassdoor', 'glassdoor_scrape', 'rapidapi_glassdoor']);

    const { data: latestFetch } = await supabase
      .from('salary_data')
      .select('fetched_date')
      .order('fetched_date', { ascending: false })
      .limit(1)
      .single();

    // Get unique companies count
    const { data: companies } = await supabase
      .from('salary_data')
      .select('company_name_normalized');
    
    const uniqueCompanies = new Set(companies?.map(c => c.company_name_normalized) || []);

    res.json({
      total_entries: totalCount || 0,
      unique_companies: uniqueCompanies.size,
      by_source: {
        israeli_survey: israeliCount || 0,
        user_reports: userReportsCount || 0,
        glassdoor: glassdoorCount || 0,
      },
      last_fetch: latestFetch?.fetched_date || null,
    });
  } catch (error) {
    console.error('Error getting salary stats:', error);
    res.status(500).json({ error: 'Failed to get salary stats' });
  }
});

export default router;
