import path from "path";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ensureConnection } from "./db";
import { setupCronJobs } from "./cron-jobs";
import { clerkMiddleware } from '@clerk/express';
import { ensureLocalUser } from './auth';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add Clerk middleware
app.use(clerkMiddleware());

// Apply ensureLocalUser middleware after Clerk auth middleware
// This will create a local user for any Clerk-authenticated user
app.use(ensureLocalUser);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Ensure database connection and session table are ready
    const isConnected = await ensureConnection();
    if (!isConnected) {
      throw new Error('Failed to establish database connection');
    }

    const server = await registerRoutes(app);
    
    // Initialize cron jobs after database connection is established
    setupCronJobs();
    log('Cron jobs initialized for user status and ranking updates');

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Global error handler:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    if (process.env.NODE_ENV === "development") {
      console.log('starting development server')
      await setupVite(app, server);
    } else {
      app.use(express.static(path.resolve(__dirname, "..", "dist", "public")));
      app.get("*", (_req, res) => {
        res.sendFile(path.resolve(__dirname, "..", "dist", "public", "index.html"));
      });
    }

    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
