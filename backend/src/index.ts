import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from './config/passport';
import authRouter from './routes/auth';
import savedJobsRouter from './routes/savedJobs';
import companiesRouter from './routes/companies';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (required for Render, Railway, etc.)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin.split(',').map(o => o.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());

// Session configuration
// TODO: Replace memory store with Redis or connect-pg-simple for production
// Memory store will cause session loss on server restarts and doesn't scale across instances
// Options: 
//   - connect-redis (recommended for horizontal scaling)
//   - connect-pg-simple (reuse existing Supabase PostgreSQL)
app.use(session({
  secret: process.env.SESSION_SECRET || 'techjobs-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax' // Must be 'lax' for OAuth redirects to work
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/auth', authRouter);

// API routes
app.use('/api/saved-jobs', savedJobsRouter);
app.use('/api/companies', companiesRouter);

// Serve frontend in production
const publicPath = path.join(__dirname, '..', 'public');
if (process.env.NODE_ENV === 'production') {
  // Serve static files
  app.use(express.static(publicPath));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
} else {
  // 404 handler for development
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
}

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 TechJobs API server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Auth:         http://localhost:${PORT}/auth/me`);
  console.log(`   Saved Jobs:   http://localhost:${PORT}/api/saved-jobs`);
  console.log(`   Companies:    http://localhost:${PORT}/api/companies`);
  console.log('');
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.log('⚠️  Google OAuth not configured. Set these environment variables:');
    console.log('   GOOGLE_CLIENT_ID=your-client-id');
    console.log('   GOOGLE_CLIENT_SECRET=your-client-secret');
  }
});

export default app;
