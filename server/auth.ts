import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";

declare global {
  namespace Express {
    // Extending the User interface to include our User type
    interface User {
      id: string;
      username: string;
      password?: string | null;
      email?: string | null;
      avatar?: string | null;
      role?: string;
      status?: string;
    }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  try {
    console.log('Comparing passwords');
    const [hashed, salt] = stored.split(".");
    
    if (!hashed || !salt) {
      console.error('Invalid stored password format');
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw error;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'developmentsecret', // For production, require a proper secret
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log('Attempting login for username:', username);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log('User not found:', username);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        if (!user.password) {
          console.log('User has no password:', username);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        console.log('Comparing passwords for user:', username);
        const isValid = await comparePasswords(password, user.password);
        
        if (!isValid) {
          console.log('Invalid password for user:', username);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        console.log('Login successful for user:', username);
        return done(null, user);
      } catch (error) {
        console.error('Error in LocalStrategy:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('Deserializing user with ID:', id, 'Type:', typeof id);
      const user = await storage.getUser(id);
      
      if (!user) {
        console.error('User not found during deserialization, ID:', id);
        return done(null, null);
      }
      
      // Don't include password in the session
      const { password, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(error, null);
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user with a unique ID
      const userId = `local_${username}_${Date.now()}`;
      const user = await storage.createUser({
        id: userId,
        username,
        password: hashedPassword,
        email: null,
        avatar: null,
        firstName: null,
        lastName: null,
        bio: null,
        profileImageUrl: null,
        role: "USER",
        status: "AMATEUR",
        isOnline: true,
        lastActive: new Date(),
        points: 0,
        rank: 0,
        postsCount: 0,
        likesCount: 0,
        potdCount: 0,
        followersCount: 0,
        followingCount: 0,
        socialLinks: {}
      });
      
      // Remove password before sending to client
      const { password: _, ...userWithoutPassword } = user;
      
      // Log user in using passport
      req.login(userWithoutPassword, (err) => {
        if (err) {
          console.error('Login error after registration:', err);
          return res.status(500).json({ message: "Error during login" });
        }
        
        // Set session cookie
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ message: "Error saving session" });
          }
          console.log('Registration successful, session saved for user:', userWithoutPassword.username);
          return res.status(201).json(userWithoutPassword);
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Failed to register" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    console.log('Login request received for username:', req.body.username);
    
    passport.authenticate("local", (err: Error, user: User, info: any) => {
      if (err) {
        console.error('Passport authentication error:', err);
        return res.status(500).json({ message: "Internal server error during login" });
      }
      
      if (!user) {
        console.log('Authentication failed:', info?.message);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      // Remove password before sending to client
      const { password, ...userWithoutPassword } = user;
      
      req.login(userWithoutPassword, (loginErr) => {
        if (loginErr) {
          console.error('Login error:', loginErr);
          return res.status(500).json({ message: "Error during login" });
        }
        
        // Set session cookie
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ message: "Error saving session" });
          }
          console.log('Login successful, session saved for user:', userWithoutPassword.username);
          return res.status(200).json(userWithoutPassword);
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Set user as offline before logging out
    storage.updateUser(req.user.id, { isOnline: false })
      .then(() => {
        req.logout((err) => {
          if (err) return next(err);
          req.session.destroy((err) => {
            if (err) {
              console.error('Error destroying session:', err);
              return res.status(500).json({ message: "Failed to logout" });
            }
            res.clearCookie('connect.sid'); // Clear the session cookie
            res.status(200).json({ message: "Logged out successfully" });
          });
        });
      })
      .catch(error => {
        console.error('Error updating user online status:', error);
        return res.status(500).json({ message: "Failed to update online status" });
      });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Remove password before sending the user data
    const { password, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });

  // Add error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Global error handler:', err);
    res.status(500).json({ message: err.message || "Internal server error" });
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized - Please log in" });
}