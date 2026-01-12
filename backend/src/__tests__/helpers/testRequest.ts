import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import request from 'supertest';
import authRouter from '../../routes/auth';
import savedJobsRouter from '../../routes/savedJobs';
import companiesRouter from '../../routes/companies';
import { TestUser } from './auth';

/**
 * Creates an Express app with optional authenticated user
 */
export function createAppWithAuth(authenticatedUser?: TestUser): Express {
  const app = express();

  // Body parser
  app.use(express.json());

  // Use memory session store for tests
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  }));

  // Passport initialization
  app.use(passport.initialize());
  app.use(passport.session());

  // Inject authenticated user if provided
  if (authenticatedUser) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      req.user = authenticatedUser;
      (req as any).isAuthenticated = () => true;
      next();
    });
  }

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.use('/auth', authRouter);

  // API routes
  app.use('/api/saved-jobs', savedJobsRouter);
  app.use('/api/companies', companiesRouter);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Test error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

/**
 * Creates a supertest request for an unauthenticated app
 */
export function createUnauthenticatedRequest() {
  return request(createAppWithAuth());
}

/**
 * Creates a supertest request for an authenticated app
 */
export function createAuthenticatedRequest(user: TestUser) {
  return request(createAppWithAuth(user));
}
