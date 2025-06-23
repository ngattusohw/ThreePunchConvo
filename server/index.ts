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
      // Color codes for different status codes
      const getStatusColor = (status: number) => {
        if (status >= 500) return "\x1b[31m"; // Red for server errors
        if (status >= 400) return "\x1b[33m"; // Yellow for client errors
        if (status >= 300) return "\x1b[36m"; // Cyan for redirects
        if (status >= 200) return "\x1b[32m"; // Green for success
        return "\x1b[37m"; // White for other
      };

      const getMethodColor = (method: string) => {
        switch (method) {
          case "GET":
            return "\x1b[36m"; // Cyan
          case "POST":
            return "\x1b[32m"; // Green
          case "PUT":
            return "\x1b[33m"; // Yellow
          case "DELETE":
            return "\x1b[31m"; // Red
          case "PATCH":
            return "\x1b[35m"; // Magenta
          default:
            return "\x1b[37m"; // White
        }
      };

      const resetColor = "\x1b[0m";
      const methodColor = getMethodColor(req.method);
      const statusColor = getStatusColor(res.statusCode);

      // Format the main log line
      let logLine = `${methodColor}${req.method.padEnd(6)}${resetColor} ${path} ${statusColor}${res.statusCode}${resetColor} ${duration}ms`;

      // Add response data if available
      if (capturedJsonResponse) {
        const responseStr = JSON.stringify(capturedJsonResponse);
        // Truncate very long responses for readability
        const truncatedResponse =
          responseStr.length > 300
            ? responseStr.substring(0, 300) + "..."
            : responseStr;
        logLine += `\n  ${"\x1b[90m"}Response:${resetColor} ${truncatedResponse}`;
      }

      log(logLine);
    }
  });

  next();
});

// Graceful shutdown handling
let httpServer: any = null;
let isShuttingDown = false;

const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) {
    console.log(`\x1b[33m⚠️  Already shutting down, ignoring ${signal}\x1b[0m`);
    return;
  }

  isShuttingDown = true;
  console.log(
    `\x1b[33m🛑 Received ${signal}, starting graceful shutdown...\x1b[0m`,
  );

  if (httpServer) {
    httpServer.close((err: any) => {
      if (err) {
        console.error("\x1b[31m❌ Error during server shutdown:\x1b[0m", err);
        process.exit(1);
      }

      console.log("\x1b[32m✅ Server closed successfully\x1b[0m");
      process.exit(0);
    });

    // Force shutdown after 30 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error("\x1b[31m❌ Forced shutdown after timeout\x1b[0m");
      process.exit(1);
    }, 30000);
  } else {
    console.log("\x1b[32m✅ No server to close, exiting\x1b[0m");
    process.exit(0);
  }
};

// Handle SIGTERM (sent by Docker/Kubernetes during deployments)
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle SIGINT (Ctrl+C)
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("\x1b[31m💥 Uncaught Exception:\x1b[0m", err);
  gracefulShutdown("uncaughtException");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "\x1b[31m💥 Unhandled Rejection at:\x1b[0m",
    promise,
    "\x1b[31mreason:\x1b[0m",
    reason,
  );
  gracefulShutdown("unhandledRejection");
});

(async () => {
  try {
    console.log("\x1b[36m🚀 Starting server...\x1b[0m");
    console.log(`\x1b[90mEnvironment:\x1b[0m ${process.env.NODE_ENV}`);
    console.log(`\x1b[90mPort:\x1b[0m ${process.env.PORT || 5000}`);

    // Ensure database connection and session table are ready
    console.log("\x1b[33m📊 Connecting to database...\x1b[0m");
    const isConnected = await ensureConnection();
    if (!isConnected) {
      throw new Error("Failed to establish database connection");
    }
    console.log("\x1b[32m✅ Database connected\x1b[0m");

    const server = await registerRoutes(app);
    console.log("\x1b[32m🛠️ Routes registered\x1b[0m");

    // Initialize cron jobs after database connection is established
    setupCronJobs();
    log(
      "\x1b[35m⏰ Cron jobs initialized for user status and ranking updates\x1b[0m",
    );

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("\x1b[31m❌ Global error handler:\x1b[0m", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    if (process.env.NODE_ENV === "development") {
      console.log("\x1b[36m🔧 Starting development server\x1b[0m");
      await setupVite(app, server);
    } else {
      console.log("\x1b[33m🔧 Setting up static file serving...\x1b[0m");
      app.use(express.static(path.resolve(__dirname, "..", "dist", "public")));
      app.get("*", (_req, res) => {
        res.sendFile(
          path.resolve(__dirname, "..", "dist", "public", "index.html"),
        );
      });
      console.log("\x1b[32m📁 Static files configured\x1b[0m");
    }

    const port = process.env.PORT || 5001;
    console.log(`\x1b[36m🌐 Starting server on port ${port}...\x1b[0m`);
    httpServer = server.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`\x1b[32m🎉 Server started successfully on port ${port}!\x1b[0m`);
      },
    );
  } catch (error) {
    console.error("\x1b[31m💥 Failed to start server:\x1b[0m", error);
    process.exit(1);
  }
})();
