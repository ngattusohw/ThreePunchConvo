import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// This function sets up the session middleware
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool,
    createTableIfMissing: true,
    tableName: "sessions",
    ttl: sessionTtl,
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "3punchconvosecret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: sessionTtl,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  });
}

export function setupAuth(app: Express) {
  // Set up session
  app.use(getSession());
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Set up the local strategy
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        
        // Simple password check
        if (user.password !== password) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
  
  // Serialize user to the session
  passport.serializeUser((user: User, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from the session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  
  // Login route
  app.post('/api/auth/login', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (err: Error, user: User, info: { message: string }) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info.message });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        
        // Mark user as online
        storage.updateUser(user.id, { isOnline: true, lastActive: new Date() });
        
        // Don't return the password
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });
  
  // Logout route
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    if (req.user) {
      const userId = (req.user as User).id;
      storage.updateUser(userId, { isOnline: false, lastActive: new Date() });
    }
    
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
  
  // Get current user route
  app.get('/api/auth/user', (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const user = req.user as User;
    // Don't return the password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  // Register route
  app.post('/api/auth/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password, email } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Create the user
      const user = await storage.createUser({ 
        username, 
        password, 
        email,
        role: "USER",
        status: "AMATEUR" 
      });
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        // Don't return the password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Failed to register user' });
    }
  });
}

// Middleware to check if user is authenticated
export function authRequired(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: 'Authentication required' });
}

// Middleware to check user roles
export function authorize(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const user = req.user as User;
    
    if (roles.includes(user.role)) {
      return next();
    }
    
    res.status(403).json({ message: 'Insufficient permissions' });
  };
}