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
      email?: string | null;
      avatar?: string | null;
      role?: string;
      status?: string;
    }
  }
}

const scryptAsync = promisify(scrypt);

// Middleware to ensure Clerk users exist in our local database
export const ensureLocalUser = async (req: any, res: any, next: any) => {
  try {
    // Skip if not authenticated
    if (!req.auth || !req.auth.userId) {
      console.log('ensureLocalUser: No auth or userId found in request', req.method, req.path);
      return next();
    }
    
    const clerkUserId = req.auth.userId;
    console.log(`ensureLocalUser: Processing Clerk user ${clerkUserId} for ${req.method} ${req.path}`);
    
    // Check if user already exists in our database
    let dbUser = await storage.getUserByExternalId(clerkUserId);
    
    if (!dbUser) {
      console.log(`ensureLocalUser: User with externalId ${clerkUserId} not found, creating new user`);
      // Get username from Clerk ID as a fallback
      // In a production app, you might want to get more user details from Clerk's API
      const username = `user_${clerkUserId.substring(clerkUserId.lastIndexOf('_') + 1)}`;
      
      try {
        // Create user in our database
        const newUser = await storage.createUser({
          username,
          externalId: clerkUserId,
          email: null, // You might want to fetch this from Clerk
          profileImageUrl: null // You might want to fetch this from Clerk
        });
        
        console.log(`ensureLocalUser: Created new local user for Clerk user: ${clerkUserId}, local ID: ${newUser.id}`);
        
        // Double-check the user was created by fetching it
        dbUser = await storage.getUserByExternalId(clerkUserId);
        
        if (!dbUser) {
          console.error(`ensureLocalUser: Failed to fetch newly created user for Clerk ID: ${clerkUserId}`);
        }
        
        // Attach the internal user ID to the request for use in route handlers
        req.localUser = dbUser || newUser;
      } catch (createError) {
        console.error('ensureLocalUser: Error creating new user:', createError);
        
        // Try one more time to check if user exists, might have been created in a race condition
        const retryUser = await storage.getUserByExternalId(clerkUserId);
        if (retryUser) {
          console.log(`ensureLocalUser: Found user on retry for Clerk ID: ${clerkUserId}`);
          req.localUser = retryUser;
        } else {
          console.error(`ensureLocalUser: Failed to create or find user for Clerk ID: ${clerkUserId}`);
        }
      }
    } else {
      console.log(`ensureLocalUser: Found existing user with ID ${dbUser.id} for Clerk user ${clerkUserId}`);
      // Attach existing user to the request
      req.localUser = dbUser;
    }
    
    // Log whether the user was attached to the request
    console.log(`ensureLocalUser: req.localUser is ${req.localUser ? 'present' : 'missing'} after middleware`);
    
    next();
  } catch (error) {
    console.error('Error in ensureLocalUser middleware:', error);
    // Continue anyway to avoid blocking the request
    next();
  }
};

// Register auth-related endpoints
export const registerAuthEndpoints = (app: Express) => {
  // Endpoint to check if a user with a specific Clerk ID exists and create one if not
  app.get('/api/users/clerk/:clerkId', async (req: any, res: Response) => {
    try {
      const clerkId = req.params.clerkId;
      
      if (!clerkId) {
        return res.status(400).json({ message: 'Clerk ID is required' });
      }
      
      console.log(`Checking if user with Clerk ID ${clerkId} exists`);
      let user = await storage.getUserByExternalId(clerkId);
      let userCreated = false;
      
      // If user doesn't exist, create a new one
      if (!user) {
        console.log(`User with Clerk ID ${clerkId} doesn't exist, creating new user`);
        
        // Generate a username based on the Clerk ID
        const username = `user_${clerkId.substring(clerkId.lastIndexOf('_') + 1)}`;
        
        try {
          // Create user in our database
          const newUser = await storage.createUser({
            username,
            externalId: clerkId,
            email: null,
            profileImageUrl: null
          });
          
          console.log(`Created new local user for Clerk ID ${clerkId}, local ID: ${newUser.id}`);
          
          // Get the created user to return
          user = await storage.getUserByExternalId(clerkId);
          userCreated = true;
          
          if (!user) {
            console.error(`Failed to fetch newly created user for Clerk ID: ${clerkId}`);
            return res.status(500).json({ message: 'Failed to create user' });
          }
        } catch (createError) {
          console.error('Error creating new user:', createError);
          
          // Try one more time to check if user exists (might have been created in a race condition)
          const retryUser = await storage.getUserByExternalId(clerkId);
          if (retryUser) {
            console.log(`Found user on retry for Clerk ID: ${clerkId}`);
            user = retryUser;
          } else {
            return res.status(500).json({ message: 'Failed to create user' });
          }
        }
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        exists: !userCreated,
        created: userCreated,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error checking/creating user:', error);
      res.status(500).json({ message: 'Failed to check/create user' });
    }
  });
};