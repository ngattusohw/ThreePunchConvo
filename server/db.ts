import { config } from "dotenv";
import path from "path";

// Load environment variables from .env file
const rootDir = process.cwd();
config({ path: path.resolve(rootDir, ".env") });
import pkg from "pg";
const { Pool } = pkg;
// import { Pool } from 'pg';
import { drizzle } from "drizzle-orm/node-postgres"; // Changed from neon-serverless
import * as schema from "@shared/schema";

// Removed Neon-specific WebSocket config

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure the connection pool for standard PostgreSQL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Can increase for standard Postgres
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // Removed maxUses (Neon-specific)
});

// Add error handler for the pool
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
});

// Add connection handler - only log in development mode to reduce noise
pool.on("connect", (client) => {
  if (
    process.env.NODE_ENV === "development" &&
    process.env.DEBUG_DB === "true"
  ) {
    console.log("New database connection established");
  }
});

export const db = drizzle(pool, { schema }); // Different syntax for node-postgres

// Export a function to check and refresh the connection if needed
export async function ensureConnection() {
  console.log("Ensuring database connection...", process.env.DATABASE_URL);

  try {
    const client = await pool.connect();
    client.release(); // Important: always release connections back to the pool
    return true;
  } catch (error) {
    console.error("Failed to connect to database:", error);
    return false;
  }
}

/*
 * IMPORTANT: Connection Pool Usage Guidelines
 *
 * 1. Never call pool.connect() directly in route handlers
 * 2. Use the 'db' object exported above for all database operations
 * 3. The connection pool automatically manages connections
 * 4. If you must use pool.connect(), always call client.release() in a finally block
 * 5. To debug excessive connections, set DEBUG_DB=true in your .env file
 */
