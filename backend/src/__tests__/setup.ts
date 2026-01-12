// Set test environment
process.env.NODE_ENV = 'test';

// Set up mock Supabase environment variables for tests
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

// Mock the database module to use our in-memory mock
jest.mock('../database');

// Import the mock's clear function
import { clearMockDatabase } from '../__mocks__/database';

// Clear the mock database before each test
beforeEach(() => {
  clearMockDatabase();
});

// Increase timeout for tests that might need it
jest.setTimeout(10000);
