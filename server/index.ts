import path from "path";
import { fileURLToPath } from "url";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { ensureConnection } from "./db";
import { setupCronJobs } from "./cron-jobs";
import { clerkMiddleware } from "@clerk/express";
import { ensureLocalUser, registerAuthEndpoints } from "./auth";
import { registerStripeEndpoints } from "./stripe";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add Clerk middleware with proper configuration
app.use(clerkMiddleware());

// Add this after the Clerk middleware but before registerAuthEndpoints
app.use((req: any, res, next) => {
  next();
});

// Register auth-related endpoints
registerAuthEndpoints(app);
registerStripeEndpoints(app);

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
    console.log("🚀 Starting server...");
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Port: ${process.env.PORT || 5000}`);

    // Ensure database connection and session table are ready
    console.log("📊 Connecting to database...");
    const isConnected = await ensureConnection();
    if (!isConnected) {
      throw new Error("Failed to establish database connection");
    }
    console.log("✅ Database connected");

    const server = await registerRoutes(app);
    console.log("🛠️ Routes registered");

    // Initialize cron jobs after database connection is established
    setupCronJobs();
    log("Cron jobs initialized for user status and ranking updates");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Global error handler:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    if (process.env.NODE_ENV === "development") {
      console.log("starting development server");
      await setupVite(app, server);
    } else {
      console.log("🔧 Setting up static file serving...");
      app.use(express.static(path.resolve(__dirname, "..", "dist", "public")));
      app.get("*", (_req, res) => {
        res.sendFile(
          path.resolve(__dirname, "..", "dist", "public", "index.html"),
        );
      });
      console.log("📁 Static files configured");
    }

    const port = process.env.PORT || 5001;
    console.log(`🌐 Starting server on port ${port}...`);
    const httpServer = server.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`serving on port ${port}`);
        console.log("🎉 Server started successfully!");
      },
    );
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
