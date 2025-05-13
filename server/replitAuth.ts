import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const isDevelopment = process.env.NODE_ENV === 'development';

if (!isDevelopment && !process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "3punchconvosessiontopsecret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: !isDevelopment,
      maxAge: sessionTtl,
      sameSite: 'lax'
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  if (!claims || !claims.sub) {
    throw new Error("Invalid claims data in upsertUser");
  }
  
  await storage.upsertUser({
    id: claims.sub,
    username: claims.username || `user_${claims.sub.substring(0, 8)}`,
    email: claims.email,
    firstName: claims.first_name,
    lastName: claims.last_name,
    bio: claims.bio,
    profileImageUrl: claims.profile_image_url,
    role: "USER",
    status: "AMATEUR",
    isOnline: true,
    points: 0,
    rank: null,
    postsCount: 0,
    likesCount: 0,
    potdCount: 0,
    followersCount: 0,
    followingCount: 0,
    socialLinks: {},
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Development mode authentication
  if (isDevelopment) {
    // Add development-only local login endpoint
    app.post("/api/auth/login", async (req, res) => {
      try {
        const { username } = req.body;
        
        if (!username) {
          return res.status(400).json({ message: 'Username is required' });
        }
        
        // Create or get user
        const user = await storage.upsertUser({
          id: `dev_${username}`,
          username,
          email: null,
          firstName: null,
          lastName: null,
          bio: null,
          profileImageUrl: null,
          role: "USER",
          status: "AMATEUR",
          isOnline: true,
          points: 0,
          rank: null,
          postsCount: 0,
          likesCount: 0,
          potdCount: 0,
          followersCount: 0,
          followingCount: 0,
          socialLinks: {},
        });

        // Log the user in
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ message: "Error logging in" });
          }
          return res.json({ user });
        });
      } catch (error) {
        console.error("Error in development login:", error);
        res.status(500).json({ message: "Internal server error during login" });
      }
    });

    app.get("/api/auth/logout", (req, res) => {
      req.logout(() => {
        res.json({ message: "Logged out successfully" });
      });
    });
  }

  // Production mode Replit authentication
  if (!isDevelopment) {
    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      const claims = tokens.claims();
      if (!claims || !claims.sub) {
        verified(new Error("Invalid claims data"), null);
        return;
      }
      
      const user = await storage.getUser(claims.sub);
      
      if (!user) {
        // Create the user if they don't exist in our system
        await upsertUser(claims);
        const newUser = await storage.getUser(claims.sub);
        if (newUser) {
          const userObject = { ...newUser };
          updateUserSession(userObject, tokens);
          verified(null, userObject);
          return;
        }
      } else {
        // User exists, update their session
        const userObject = { ...user };
        updateUserSession(userObject, tokens);
        verified(null, userObject);
        return;
      }
      
      // Fallback if something went wrong
      verified(new Error("Failed to authenticate user"), null);
    };

    // Add domains from REPLIT_DOMAINS
    for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
    }

    app.get("/api/login", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/callback", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
        failWithError: true
      })(req, res, next);
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      });
    });
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (isDevelopment) {
    return next();
  }

  const user = req.user as any;
  
  // If user has no claims or expires_at, they might not be properly authenticated
  if (!user || !user.claims || !user.expires_at) {
    console.log("User missing claims or expiration", user);
    return res.status(401).json({ message: "Invalid session" });
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next(); // Token still valid
  }

  // Token expired, try to refresh
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    // No refresh token available
    console.log("No refresh token available");
    return res.status(401).json({ message: "Session expired" });
  }

  try {
    // Try to refresh the token
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    console.error("Failed to refresh token:", error);
    return res.status(401).json({ message: "Authentication failed" });
  }
};