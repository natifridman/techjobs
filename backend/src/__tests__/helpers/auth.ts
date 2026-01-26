import { v4 as uuidv4 } from 'uuid';
import db from '../../database';

export interface TestUser {
  id: string;
  google_id: string;
  email: string;
  name: string;
  picture: string;
  created_date: string;
  updated_date: string;
}

/**
 * Generates a valid UUID for test entities
 */
export function generateTestId(): string {
  return uuidv4();
}

/**
 * Creates a test user in the database
 */
export async function createTestUser(overrides: Partial<TestUser> = {}): Promise<TestUser> {
  const id = overrides.id || uuidv4();
  const now = new Date().toISOString();

  const user: TestUser = {
    id,
    google_id: overrides.google_id || `google-${id}`,
    email: overrides.email || `test-${id}@example.com`,
    name: overrides.name || 'Test User',
    picture: overrides.picture || 'https://example.com/photo.jpg',
    created_date: overrides.created_date || now,
    updated_date: overrides.updated_date || now,
  };

  await db.from('users').insert({
    id: user.id,
    google_id: user.google_id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    created_date: user.created_date,
    updated_date: user.updated_date,
  });

  return user;
}

/**
 * Deletes a test user and all their data
 */
export async function deleteTestUser(userId: string): Promise<void> {
  await db.from('saved_jobs').delete().eq('user_id', userId);
  await db.from('users').delete().eq('id', userId);
}

/**
 * Clears all users and saved jobs from the database
 */
export async function clearUsers(): Promise<void> {
  await db.from('saved_jobs').delete().neq('id', '');
  await db.from('users').delete().neq('id', '');
}

/**
 * Clears all companies from the database
 */
export async function clearCompanies(): Promise<void> {
  await db.from('companies').delete().neq('id', '');
}

/**
 * Clears all test data from the database
 */
export async function clearAllData(): Promise<void> {
  await clearUsers();
  await clearCompanies();
}

/**
 * Gets a user by ID
 */
export async function getUserById(id: string): Promise<TestUser | undefined> {
  const { data } = await db.from('users').select('*').eq('id', id).single();
  return data as TestUser | undefined;
}

/**
 * Helper to insert a saved job directly into the database for testing
 */
export async function insertSavedJob(data: {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  url: string;
  created_date: string;
  updated_date: string;
  applied?: boolean;
  applied_date?: string;
  comments?: string;
  category?: string;
  city?: string;
  level?: string;
  size?: string;
  job_category?: string;
}): Promise<void> {
  await db.from('saved_jobs').insert({
    ...data,
    applied: data.applied ?? false,
  });
}

/**
 * Helper to insert a company directly into the database for testing
 */
export async function insertCompany(data: {
  id: string;
  name: string;
  description?: string;
  website_url?: string;
  logo_url?: string;
  founded_year?: string;
  headquarters?: string;
  growth_summary?: string;
  similar_companies?: string[];
  created_date: string;
  updated_date: string;
}): Promise<void> {
  await db.from('companies').insert(data);
}

/**
 * Helper to get a company by ID for verification
 */
export async function getCompanyById(id: string): Promise<Record<string, unknown> | undefined> {
  const { data } = await db.from('companies').select('*').eq('id', id).single();
  return data as Record<string, unknown> | undefined;
}

/**
 * Helper to get a saved job by ID for verification
 */
export async function getSavedJobById(id: string): Promise<Record<string, unknown> | undefined> {
  const { data } = await db.from('saved_jobs').select('*').eq('id', id).single();
  return data as Record<string, unknown> | undefined;
}
