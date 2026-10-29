import { Router, Request, Response, NextFunction } from 'express';
import passport from '../config/passport';

const router = Router();

declare module 'express-session' {
  interface SessionData { returnTo?: string }
}

/** OAuth must only return to this frontend, including its search and hash. */
export function safeReturnTo(value?: unknown): string {
  const frontend = new URL(process.env.FRONTEND_URL || 'http://localhost:8080');
  if (typeof value !== 'string') return frontend.href;
  try {
    const destination = new URL(value, frontend);
    if (destination.origin === frontend.origin && !destination.username && !destination.password
      && ['http:', 'https:'].includes(destination.protocol)) {
      return destination.href;
    }
  } catch { /* Invalid destinations return to the configured frontend. */ }
  return frontend.href;
}

export function authFailureRedirect(returnTo?: unknown): string {
  const destination = new URL(safeReturnTo(returnTo));
  destination.searchParams.set('authError', '1');
  return destination.href;
}

router.use((_req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  res.vary('Cookie');
  next();
});

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
  req.session.returnTo = safeReturnTo(req.query.redirect);
  
  // Save session before redirecting to Google
  req.session.save((err) => {
    if (err) {
      console.error('Error saving session:', err);
      res.status(503).json({ error: 'Sign-in is temporarily unavailable. Please try again.' });
      return;
    }
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })(req, res, next);
  });
});

// Google OAuth callback
router.get('/google/callback', (req: Request, res: Response, next: NextFunction) => {
  // Passport regenerates the session on login. Capture the destination first
  // so the user's filters and continuation point survive that regeneration.
  const returnTo = safeReturnTo(req.session.returnTo);
  delete req.session.returnTo;
  const fail = () => req.session.save(() => res.redirect(authFailureRedirect(returnTo)));
  passport.authenticate('google', (err: Error | null, user: Express.User | false | null) => {
    if (err || !user) {
      if (err) console.error('Google sign-in failed:', err.message);
      fail();
      return;
    }
    req.logIn(user, (loginError) => {
      if (loginError) {
        fail();
        return;
      }
      req.session.save((saveError) => {
        if (saveError) {
          res.redirect(authFailureRedirect(returnTo));
          return;
        }
        res.redirect(returnTo);
      });
    });
  })(req, res, next);
});

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
