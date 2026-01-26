import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabase, { JobApplication } from '../database';

const router = Router();

// POST track job application click (no auth required)
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      job_title,
      company,
      category,
      city,
      url,
      level,
      size,
      job_category
    } = req.body;

    if (!job_title || !company || !url) {
      return res.status(400).json({ error: 'job_title, company, and url are required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Get user info if authenticated (optional)
    const userId = req.user?.id || null;
    const userEmail = req.user?.email || null;

    const insertData: Partial<JobApplication> & { id: string; job_title: string; company: string; url: string } = {
      id,
      user_id: userId,
      user_email: userEmail,
      job_title,
      company,
      category: category || null,
      city: city || null,
      url,
      level: level || null,
      size: size || null,
      job_category: job_category || null,
      clicked_at: now
    };

    const { data: newApplication, error } = await supabase
      .from('job_applications')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error tracking job application:', error);
      return res.status(500).json({ error: 'Failed to track application' });
    }

    res.status(201).json(newApplication as JobApplication);
  } catch (error: any) {
    console.error('Error tracking job application:', error);
    return res.status(500).json({ error: 'Failed to track application' });
  }
});

// GET all applications for current user (requires auth)
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    
    const { data: applications, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', userId)
      .order('clicked_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return res.status(500).json({ error: 'Failed to fetch applications' });
    }
    
    res.json(applications as JobApplication[]);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET all applications (admin - no user filter)
router.get('/all', async (req: Request, res: Response) => {
  try {
    const { data: applications, error } = await supabase
      .from('job_applications')
      .select('*')
      .order('clicked_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error fetching all applications:', error);
      return res.status(500).json({ error: 'Failed to fetch applications' });
    }
    
    res.json(applications as JobApplication[]);
  } catch (error) {
    console.error('Error fetching all applications:', error);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

export default router;
