import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Extend the Request interface to include localUser with all necessary fields
declare global {
  namespace Express {
    interface Request {
      localUser?: {
        id: string;
        username: string;
        email?: string | null;
        password?: string | null;
        externalId?: string | null;
        stripeId?: string | null;
        planType?: string;
        avatar?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        bio?: string | null;
        profileImageUrl?: string | null;
        updatedAt?: Date;
        role?: string;
        status?: string;
        createdAt?: Date;
        isOnline?: boolean;
        lastActive?: Date;
        points?: number;
        rank?: number;
        postsCount?: number;
        likesCount?: number;
        pinnedByUserCount?: number;
        pinnedCount?: number;
        potdCount?: number;
        repliesCount?: number;
        followersCount?: number;
        followingCount?: number;
        socialLinks?: Record<string, string>;
        disabled?: boolean;
        disabledAt?: Date;
        metadata?: Record<string, string>;
      };
    }
  }
}

// Middleware to ensure Clerk users exist in our local database
// Make sure it's correctly extracting the Clerk token
export const ensureLocalUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log("Authorization header:", req.headers.authorization);

    // Extract user ID from bearer token if req.auth doesn't have it
    let userId = req.auth?.userId;

    if (!userId && req.headers.authorization?.startsWith("Bearer ")) {
      const token = req.headers.authorization.split(" ")[1];
      try {
        // Parse the JWT (not verifying signature, just extracting payload)
        const base64Payload = token.split(".")[1];
        const payload = JSON.parse(
          Buffer.from(base64Payload, "base64").toString(),
        );
        userId = payload.sub;
        console.log("Extracted userId from JWT:", userId);
      } catch (error) {
        console.error("Error extracting userId from JWT:", error);
      }
    }

    if (!userId) {
      console.log(
        "ensureLocalUser: No auth or userId found in request",
        req.method,
        req.originalUrl,
      );
      return res.status(400).json({ message: "User not found" });
    }

    // Find the local user based on Clerk ID
    const localUser = await storage.getUserByExternalId(userId);

    if (!localUser) {
      console.log(
        `ensureLocalUser: No local user found for Clerk ID ${userId}`,
      );
      return res.status(400).json({ message: "User not found" });
    }

    // Attach the local user to the request
    req.localUser = localUser;
    console.log(
      `ensureLocalUser: Found local user ${localUser.id} for Clerk ID ${userId}`,
    );

    next();
  } catch (error) {
    console.error("Error in ensureLocalUser middleware:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Middleware to check if user has a paid plan
export const requirePaidPlan = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Make sure we have a local user
    if (!req.localUser) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if user has a special role that bypasses paid plan requirement
    const userRole = req.localUser.role || "USER";
    console.log("User role:", userRole);
    const bypassRoles = [
      "ADMIN",
      "MODERATOR",
      "FIGHTER",
      "INDUSTRY_PROFESSIONAL",
    ];

    if (bypassRoles.includes(userRole)) {
      // User has a special role, allow access without checking plan
      console.log(
        `User ${req.localUser.id} (${userRole}) bypassed paid plan requirement`,
      );
      return next();
    }

    // Check the user's plan type
    const planType = req.localUser.planType || "FREE";

    // Allow if the user has a paid plan (not FREE)
    if (planType === "FREE") {
      return res.status(403).json({
        message: "This feature requires a paid subscription",
        error: "UPGRADE_REQUIRED",
        currentPlan: planType,
        requiredPlans: ["BASIC", "PRO"],
      });
    }

    // User has a paid plan, continue
    next();
  } catch (error) {
    console.error("Error in requirePaidPlan middleware:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Register auth-related endpoints
export const registerAuthEndpoints = (app: Express) => {
  // Endpoint to check if a user with a specific Clerk ID exists and create one if not
  app.post("/api/users/clerk/:clerkId", async (req: any, res: Response) => {
    try {
      const clerkId = req.params.clerkId;
      const { firstName, lastName, email, profileImageUrl, username } =
        req.body;

      if (!clerkId) {
        return res.status(400).json({ message: "Clerk ID is required" });
      }

      console.log(`Checking if user with Clerk ID ${clerkId} exists`);
      let user = await storage.getUserByExternalId(clerkId);
      let userCreated = false;

      if (user?.metadata?.bannedByAdmin) {
        return res.status(403).json({ message: "User is banned" });
      }

      // If user doesn't exist, create a new one
      if (!user) {
        console.log(
          `User with Clerk ID ${clerkId} doesn't exist, creating new user`,
        );

        // Use provided username or generate one based on Clerk ID
        const finalUsername =
          username || `user_${clerkId.substring(clerkId.lastIndexOf("_") + 1)}`;

        try {
          // Check for fighter token in request body OR Clerk metadata
          const fighterToken = req.body.fighterInvitationToken || 
                              req.body.unsafeMetadata?.fighterInvitationToken;

          let defaultRole = "USER";
          let invitationUsed = false;

          if (fighterToken) {
            try {
              console.log(`Checking fighter invitation token: ${fighterToken}`);
              const invitation = await storage.getFighterInvitationByToken(fighterToken);
              
              if (invitation && 
                  invitation.status === 'PENDING' && 
                  new Date(invitation.expiresAt) > new Date()) {
                
                // Verify the email matches
                if (invitation.email === email) {
                  defaultRole = "FIGHTER";
                  console.log(`Valid fighter invitation found for ${email}, setting role to FIGHTER`);
                  invitationUsed = true;
                } else {
                  console.log(`Email mismatch: invitation for ${invitation.email}, signup for ${email}`);
                }
              } else {
                console.log(`Invalid or expired fighter invitation token: ${fighterToken}`);
              }
            } catch (invitationError) {
              console.error("Error checking fighter invitation:", invitationError);
              // Continue with regular user creation if invitation check fails
            }
          }

          // Create user in our database with Clerk profile data
          const newUser = await storage.createUser({
            username: finalUsername,
            externalId: clerkId,
            firstName,
            lastName,
            email,
            profileImageUrl,
            role: defaultRole, // Will be "FIGHTER" if invitation is valid, otherwise "USER"
          });

          console.log("auth profile: ", profileImageUrl);
          console.log(
            `Created new local user for Clerk ID ${clerkId}, local ID: ${newUser.id}, role: ${defaultRole}`,
          );

          // Mark invitation as used if it was a fighter signup
          if (invitationUsed && fighterToken) {
            try {
              const invitation = await storage.getFighterInvitationByToken(fighterToken);
              if (invitation) {
                await storage.updateFighterInvitationStatus(
                  invitation.id, 
                  'ACCEPTED', 
                  newUser.id
                );
                console.log(`Marked fighter invitation ${invitation.id} as ACCEPTED`);
              }
            } catch (invitationUpdateError) {
              console.error("Error updating fighter invitation status:", invitationUpdateError);
              // Don't fail user creation if invitation update fails
            }
          }

          // Get the created user to return
          user = await storage.getUserByExternalId(clerkId);
          userCreated = true;

          if (!user) {
            console.error(
              `Failed to fetch newly created user for Clerk ID: ${clerkId}`,
            );
            return res.status(500).json({ message: "Failed to create user" });
          }
        } catch (createError) {
          console.error("Error creating new user:", createError);

          // Try one more time to check if user exists (might have been created in a race condition)
          const retryUser = await storage.getUserByExternalId(clerkId);
          if (retryUser) {
            console.log(`Found user on retry for Clerk ID: ${clerkId}`);
            user = retryUser;
          } else {
            return res.status(500).json({ message: "Failed to create user" });
          }
        }
      } else {
        // User exists, update their profile data if provided
        if (firstName || lastName || email || profileImageUrl || username) {
          try {
            const updates: Record<string, string | null> = {};
            if (firstName) updates["firstName"] = firstName;
            if (lastName) updates["lastName"] = lastName;
            if (email) updates["email"] = email;
            if (profileImageUrl) updates["profileImageUrl"] = profileImageUrl;
            if (username) updates["username"] = username;

            // Only update if there are changes
            if (Object.keys(updates).length > 0) {
              const updatedUser = await storage.updateUser(user.id, updates);
              if (updatedUser) {
                user = updatedUser;
                console.log(
                  `Updated user ${user.id} with latest Clerk profile data`,
                );
              }
            }
          } catch (updateError) {
            console.error("Error updating user profile:", updateError);
            // Continue with existing user data even if update fails
          }
        }
        // ✅ ADD THIS: Check for fighter invitation token even for existing users
        const fighterToken = req.body.fighterInvitationToken;
        if (fighterToken && user.role !== "FIGHTER") {
          try {
            console.log(`Checking fighter invitation token for existing user: ${fighterToken}`);
            const invitation = await storage.getFighterInvitationByToken(fighterToken);
            
            if (invitation && 
                invitation.status === 'PENDING' && 
                new Date(invitation.expiresAt) > new Date()) {
              
              // Verify the email matches
              if (invitation.email === email || invitation.email === user.email) {
                console.log("🔥 Email matches invitation email, updating user role to FIGHTER");
                // Update user role to FIGHTER
                const updatedUser = await storage.updateUser(user.id, { role: "FIGHTER" });
                if (updatedUser) {
                  user = updatedUser;
                  console.log(`Updated existing user ${user.id} role to FIGHTER`);
                  
                  // Mark invitation as used
                  await storage.updateFighterInvitationStatus(
                    invitation.id, 
                    'ACCEPTED', 
                    user.id
                  );
                  console.log(`Marked fighter invitation ${invitation.id} as ACCEPTED`);
                }
              } else {
                console.log(`Email mismatch: invitation for ${invitation.email}, user email ${user.email || email}`);
              }
            } else {
              console.log(`Invalid or expired fighter invitation token: ${fighterToken}`);
            }
          } catch (invitationError) {
            console.error("Error checking fighter invitation for existing user:", invitationError);
          }
        }
      }

      // Don't return password in response
      const { password, ...userWithoutPassword } = user;

      res.json({
        exists: !userCreated,
        created: userCreated,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Error checking/creating user:", error);
      res.status(500).json({ message: "Failed to check/create user" });
    }
  });
};
