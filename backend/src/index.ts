import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { Pool } from 'pg';
import passport from './config/passport';
import authRouter from './routes/auth';
import savedJobsRouter from './routes/savedJobs';
import companiesRouter from './routes/companies';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// Check required environment variables
const requiredEnvVars = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(v => console.error(`   - ${v}`));
  console.error('');
  console.error('Set these in Render Dashboard > Environment');
}

// Trust proxy (required for Render, Railway, etc.)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://pagead2.googlesyndication.com", "https://www.googletagservices.com", "https://*.posthog.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://raw.githubusercontent.com", "https://*.posthog.com"],
      frameSrc: ["https://accounts.google.com", "https://googleads.g.doubleclick.net", "https://tpc.googlesyndication.com"],
    }
  } : false,  // Disable in development for easier debugging
  crossOriginEmbedderPolicy: false, // Allow embedding of Google OAuth
}));

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin.split(',').map(o => o.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in test environment
  skip: () => process.env.NODE_ENV === 'test'
});

// Apply rate limiter to all routes
app.use(limiter);

// Stricter rate limit for auth routes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per 15 minutes
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test'
});

// Body parser with size limits to prevent large payload attacks
app.use(express.json({ limit: '10kb' }));

// PostgreSQL session store using Supabase
const PgStore = pgSession(session);

// Use DATABASE_URL directly (get from Supabase Dashboard > Settings > Database > Connection string)
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL not set! Get it from Supabase Dashboard > Settings > Database > Connection string (URI)');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

// Test database connection
pool.query('SELECT NOW()')
  .then(() => console.log('✅ PostgreSQL connected'))
  .catch(err => console.error('❌ PostgreSQL connection failed:', err.message));

// Session configuration with PostgreSQL persistence
app.use(session({
  store: new PgStore({
    pool,
    tableName: 'session',
    createTableIfMissing: false, // We create it via supabase-schema.sql
    errorLog: console.error.bind(console),
  }),
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

// Auth routes (with stricter rate limiting)
app.use('/auth', authLimiter, authRouter);

// API routes
app.use('/api/saved-jobs', savedJobsRouter);
app.use('/api/companies', companiesRouter);

// Serve frontend in production
const publicPath = path.join(__dirname, '..', 'public');
if (process.env.NODE_ENV === 'production') {
  // Serve static files
  app.use(express.static(publicPath));
  
  // SPA fallback - serve index.html for all non-API routes
  // Only serve index.html for routes (not files with extensions)
  app.use((req, res) => {
    // If the request has a file extension, it's a static file that wasn't found
    if (path.extname(req.path)) {
      res.status(404).send('Not found');
      return;
    }
    // Otherwise, serve index.html for client-side routing
    res.sendFile(path.join(publicPath, 'index.html'));
  });
} else {
  // 404 handler for development
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
}

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
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
