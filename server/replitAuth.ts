import * as client from "openid-client";
import { Strategy } from "openid-client/build/passport";
import type { VerifyFunction } from "openid-client/build/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Extend User type with Replit-specific fields
interface ReplitUser extends User {
  claims?: any;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

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
  user: ReplitUser,
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

  // Only set up Replit authentication in production
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
  next();
};