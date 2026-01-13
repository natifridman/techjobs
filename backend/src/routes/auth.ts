import { Router, Request, Response, NextFunction } from 'express';
import passport from '../config/passport';
import type { User } from '../config/passport';

const router = Router();

// Allowed redirect origins for OAuth flow (prevents open redirect attacks)
const ALLOWED_REDIRECT_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:8080')
  .split(',')
  .map(o => o.trim());

// Default redirect should be from allowed origins to ensure consistency
const DEFAULT_REDIRECT = process.env.FRONTEND_URL || ALLOWED_REDIRECT_ORIGINS[0] || 'http://localhost:8080';

/**
 * Validates that a redirect URL is safe (same origin or allowed origins)
 * Prevents open redirect attacks in OAuth flow
 */
function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Check if the origin is in our allowed list
    return ALLOWED_REDIRECT_ORIGINS.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        return parsed.origin === allowedUrl.origin;
      } catch {
        return false;
      }
    });
  } catch {
    // If URL parsing fails, check if it's a relative path (safe)
    return url.startsWith('/') && !url.startsWith('//');
  }
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface User {
      id: string;
      google_id: string;
      email: string;
      name: string;
      picture: string;
      created_date: string;
      updated_date: string;
    }
  }
}

// Get current user
router.get('/me', (req: Request, res: Response) => {
  if (req.isAuthenticated() && req.user) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        picture: req.user.picture
      }
    });
  } else {
    res.json({ authenticated: false, user: null });
  }
});

// Initiate Google OAuth
router.get('/google', (req: Request, res: Response, next: NextFunction) => {
  // Store the redirect URL in session (with validation to prevent open redirect)
  const requestedRedirect = req.query.redirect as string;
  
  // Validate redirect URL to prevent open redirect attacks
  const redirectUrl = requestedRedirect && isValidRedirectUrl(requestedRedirect) 
    ? requestedRedirect 
    : DEFAULT_REDIRECT;
  
  (req.session as any).returnTo = redirectUrl;
  
  // Save session before redirecting to Google
  req.session.save((err) => {
    if (err) {
      console.error('Error saving session:', err);
    }
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })(req, res, next);
  });
});

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/auth/failure'
  }),
  (req: Request, res: Response) => {
    // Redirect to frontend after successful login
    // Re-validate returnTo for defense-in-depth against session manipulation
    const storedReturn = (req.session as any).returnTo;
    const returnTo = storedReturn && isValidRedirectUrl(storedReturn) ? storedReturn : DEFAULT_REDIRECT;
    delete (req.session as any).returnTo;
    res.redirect(returnTo);
  }
);

// Auth failure
router.get('/failure', (req: Request, res: Response) => {
  res.status(401).json({ error: 'Authentication failed' });
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session destruction failed' });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });
});

// Middleware to require authentication
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Middleware to optionally get user (doesn't require auth)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // User will be available if authenticated, undefined otherwise
  next();
};

export default router;
