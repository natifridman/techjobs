import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabase, { SavedJob } from '../database';
import { requireAuth } from './auth';
import { isValidUUID, isValidUrl } from '../utils/validation';

const router = Router();

// All saved jobs routes require authentication
router.use(requireAuth);

// GET all saved jobs for the current user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const sortBy = req.query.sort as string || '-created_date';
    const orderColumn = sortBy.replace('-', '');
    const ascending = !sortBy.startsWith('-');
    
    const validColumns = ['created_date', 'updated_date', 'job_title', 'company'];
    const column = validColumns.includes(orderColumn) ? orderColumn : 'created_date';
    
    const { data: jobs, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('user_id', userId)
      .order(column, { ascending });

    if (error) {
      console.error('Error fetching saved jobs:', error);
      return res.status(500).json({ error: 'Failed to fetch saved jobs' });
    }
    
    res.json(jobs as SavedJob[]);
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    return res.status(500).json({ error: 'Failed to fetch saved jobs' });
  }
});

// GET saved job by URL (must be before /:id to avoid shadowing)
router.get('/by-url/:url', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const url = decodeURIComponent(req.params.url as string);
    
    const { data: job, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('url', url)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Job not found' });
      }
      console.error('Error fetching saved job by URL:', error);
      return res.status(500).json({ error: 'Failed to fetch saved job' });
    }
    
    res.json(job as SavedJob);
  } catch (error) {
    console.error('Error fetching saved job by URL:', error);
    return res.status(500).json({ error: 'Failed to fetch saved job' });
  }
});

// GET saved job by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }
    
    const { data: job, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Job not found' });
      }
      console.error('Error fetching saved job:', error);
      return res.status(500).json({ error: 'Failed to fetch saved job' });
    }
    
    res.json(job as SavedJob);
  } catch (error) {
    console.error('Error fetching saved job:', error);
    return res.status(500).json({ error: 'Failed to fetch saved job' });
  }
});

// POST create new saved job
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      job_title,
      company,
      category,
      city,
      url,
      level,
      size,
      job_category,
      applied,
      applied_date,
      comments
    } = req.body;

    if (!job_title || !company || !url) {
      return res.status(400).json({ error: 'job_title, company, and url are required' });
    }

    // Validate URL format
    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const user = req.user!;

    // Store user_name and user_email for audit/history purposes (denormalized - won't update if user profile changes)
    const insertData: Partial<SavedJob> & { id: string; user_id: string; job_title: string; company: string; url: string } = {
      id,
      user_id: userId,
      user_name: user.name || null,
      user_email: user.email || null,
      job_title,
      company,
      category: category || null,
      city: city || null,
      url,
      level: level || null,
      size: size || null,
      job_category: job_category || null,
      applied: applied || false,
      applied_date: applied_date || null,
      comments: comments || null,
      created_date: now,
      updated_date: now
    };

    const { data: newJob, error } = await supabase
      .from('saved_jobs')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating saved job:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Job with this URL already saved' });
      }
      return res.status(500).json({ error: 'Failed to create saved job' });
    }

    res.status(201).json(newJob as SavedJob);
  } catch (error: any) {
    console.error('Error creating saved job:', error);
    return res.status(500).json({ error: 'Failed to create saved job' });
  }
});

// PUT update saved job
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updates = req.body;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }
    
    // Check if job exists and belongs to user
    const { data: existing, error: selectError } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (selectError) {
      if (selectError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Job not found' });
      }
      console.error('Error checking saved job:', selectError);
      return res.status(500).json({ error: 'Failed to check saved job' });
    }

    const allowedFields = ['job_title', 'company', 'category', 'city', 'url', 'level', 'size', 'job_category', 'applied', 'applied_date', 'comments'];
    const updateData: Partial<SavedJob> = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        // Validate URL format if updating url field
        if (field === 'url' && !isValidUrl(updates[field])) {
          return res.status(400).json({ error: 'Invalid URL format' });
        }
        (updateData as Record<string, unknown>)[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateData.updated_date = new Date().toISOString();

    const { data: updatedJob, error: updateError } = await supabase
      .from('saved_jobs')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating saved job:', updateError);
      return res.status(500).json({ error: 'Failed to update saved job' });
    }

    res.json(updatedJob as SavedJob);
  } catch (error) {
    console.error('Error updating saved job:', error);
    return res.status(500).json({ error: 'Failed to update saved job' });
  }
});

// DELETE saved job
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }
    
    // Check if job exists and belongs to user
    const { data: existing, error: selectError } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (selectError) {
      if (selectError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Job not found' });
      }
      console.error('Error checking saved job:', selectError);
      return res.status(500).json({ error: 'Failed to check saved job' });
    }

    const { error: deleteError } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting saved job:', deleteError);
      return res.status(500).json({ error: 'Failed to delete saved job' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting saved job:', error);
    return res.status(500).json({ error: 'Failed to delete saved job' });
  }
});

export default router;
