import { getAuth } from 'firebase-admin/auth';
import { cert, initializeApp } from 'firebase-admin/app';
import { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { storage } from './storage';
import { User as UserType } from '@shared/schema';

// Initialize Firebase Admin SDK with a default app
// We're using a try-catch to handle potential re-initialization
try {
  // Since we don't have actual Firebase credentials yet, we'll use a mock approach for development
  initializeApp({
    // This is just a placeholder that allows initialization without real credentials
    // Will be replaced with actual credentials when they are provided
    projectId: 'mock-project-id'
  });
  console.log("Firebase Admin initialized in development mode");
} catch (error) {
  console.error("Firebase admin initialization error:", error);
}

declare global {
  namespace Express {
    interface User extends UserType {}
  }
}

export interface DecodedIdToken {
  iss: string;
  aud: string;
  auth_time: number;
  user_id: string;
  sub: string;
  iat: number;
  exp: number;
  email: string;
  email_verified: boolean;
  firebase: {
    identities: {
      [key: string]: any;
    };
    sign_in_provider: string;
  };
  uid: string;
  name?: string;
  picture?: string;
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  app.set('trust proxy', 1);
  app.use(session(sessionSettings));

  // Middleware to deserialize user from session
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.session as any).userId;
    if (userId) {
      const user = await storage.getUser(userId);
      if (user) {
        (req as any).user = user;
      }
    }
    next();
  });

  // Verify Firebase token middleware
  const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
      // For development only - if we don't have Firebase properly set up yet,
      // we'll mock the token verification and just pass through
      // Remove this in production!
      if (process.env.FIREBASE_PROJECT_ID) {
        // Actual verification with Firebase Admin
        const auth = getAuth();
        const decodedToken = await auth.verifyIdToken(idToken) as DecodedIdToken;
        (req as any).decodedToken = decodedToken;
      } else {
        console.warn("Firebase credentials not set. Using mock authentication for development.");
        // Mock a decoded token - this is for development only
        (req as any).decodedToken = {
          email: "test@example.com",
          email_verified: true,
          uid: "mock-uid-123",
          name: "Test User",
          picture: "https://via.placeholder.com/150",
          iss: "mock-issuer",
          aud: "mock-audience",
          auth_time: Date.now() / 1000,
          user_id: "mock-user-id",
          sub: "mock-sub",
          iat: Date.now() / 1000,
          exp: Date.now() / 1000 + 3600,
          firebase: {
            identities: {},
            sign_in_provider: "google.com"
          }
        };
      }
      next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  };

  // Authentication routes
  app.post('/api/auth/google', verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
      const decodedToken = (req as any).decodedToken;
      
      if (!decodedToken) {
        return res.status(401).json({ message: 'Authentication failed' });
      }
      
      // Check if user exists in our db
      let user = await storage.getUserByUsername(decodedToken.email);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          username: decodedToken.email,
          email: decodedToken.email,
          password: '', // Not used with OAuth
          avatar: decodedToken.picture || '',
          role: 'USER',
          status: 'AMATEUR',
          isOnline: true,
          socialLinks: {},
        });
      }
      
      // Store user id in session
      (req.session as any).userId = user.id;
      
      // Return user data
      return res.status(200).json(user);
    } catch (error) {
      console.error('Google auth error:', error);
      return res.status(500).json({ message: 'Authentication failed' });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Successfully logged out' });
    });
  });

  app.get('/api/auth/me', async (req: Request, res: Response) => {
    if (!(req as any).user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    return res.status(200).json((req as any).user);
  });
}

// Authentication middleware for protected routes
export function authRequired(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

// Role-based authorization middleware
export function authorize(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes((req as any).user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
}