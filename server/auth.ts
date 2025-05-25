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
// Make sure it's correctly extracting the Clerk token
export const ensureLocalUser = async (req, res, next) => {
  try {
    console.log("Authorization header:", req.headers.authorization);
    
    // Extract user ID from bearer token if req.auth doesn't have it
    let userId = req.auth?.userId;
    
    if (!userId && req.headers.authorization?.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        // Parse the JWT (not verifying signature, just extracting payload)
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
        userId = payload.sub;
        console.log("Extracted userId from JWT:", userId);
      } catch (error) {
        console.error("Error extracting userId from JWT:", error);
      }
    }
    
    if (!userId) {
      console.log("ensureLocalUser: No auth or userId found in request", req.method, req.originalUrl);
      return res.status(400).json({ message: "User not found" });
    }
    
    // Find the local user based on Clerk ID
    const localUser = await storage.getUserByExternalId(userId);
    
    if (!localUser) {
      console.log(`ensureLocalUser: No local user found for Clerk ID ${userId}`);
      return res.status(400).json({ message: "User not found" });
    }
    
    // Attach the local user to the request
    req.localUser = localUser;
    console.log(`ensureLocalUser: Found local user ${localUser.id} for Clerk ID ${userId}`);
    
    next();
  } catch (error) {
    console.error("Error in ensureLocalUser middleware:", error);
    res.status(500).json({ message: "Server error" });
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