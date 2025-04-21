import { getAuth } from 'firebase-admin/auth';
import { cert, initializeApp } from 'firebase-admin/app';
import { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { storage } from './storage';
import { User as UserType } from '@shared/schema';

// Initialize Firebase Admin SDK with a default app
// We're using a try-catch to handle potential re-initialization
try {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (isDevelopment) {
    // In development, use a basic app configuration without credentials
    // This allows the server to start, but Firebase auth verification will be mocked
    initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
    }, 'default');
    console.log("Firebase Admin initialized in development mode");
  } else {
    // In production, use proper service account credentials
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log("Firebase Admin initialized with credentials");
  }
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
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (!idToken) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
      if (isDevelopment && idToken === 'dev-mode-token') {
        // For development only - allow a special token for testing
        console.log("Using development mode auth");
        (req as any).decodedToken = {
          uid: 'dev-user-123',
          email: 'dev@example.com',
          email_verified: true,
          name: 'Development User',
          picture: 'https://ui-avatars.com/api/?name=Dev+User&background=random',
          auth_time: Date.now() / 1000,
          user_id: 'dev-user-123',
          iss: 'https://securetoken.google.com/demo-project',
          aud: 'demo-project',
          iat: Date.now() / 1000,
          exp: Date.now() / 1000 + 3600,
          sub: 'dev-user-123',
          firebase: {
            identities: { email: ['dev@example.com'] },
            sign_in_provider: 'password'
          }
        };
        return next();
      }
      
      // Standard token verification
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(idToken) as DecodedIdToken;
      (req as any).decodedToken = decodedToken;
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