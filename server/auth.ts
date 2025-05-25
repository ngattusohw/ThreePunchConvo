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
    const dbUser = await storage.getUserByExternalId(clerkUserId);
    
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
        
        // Attach the internal user ID to the request for use in route handlers
        req.localUser = newUser;
      } catch (createError) {
        console.error('ensureLocalUser: Error creating new user:', createError);
        // Still continue to next middleware to avoid blocking the request
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