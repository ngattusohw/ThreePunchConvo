import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env file
const rootDir = process.cwd();
config({ path: path.resolve(rootDir, ".env") });

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure the connection pool with better defaults for serverless
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 5000, // Timeout after 5 seconds when connecting
  maxUses: 7500 // Number of times a connection can be used before being closed
});

// Add error handler for the pool
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

// Add connection handler - only log in development mode to reduce noise
pool.on('connect', (client) => {
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_DB === 'true') {
    console.log('New database connection established');
  }
});

export const db = drizzle({ client: pool, schema });

// Export a function to check and refresh the connection if needed
export async function ensureConnection() {
  try {
    const client = await pool.connect();
    client.release(); // Important: always release connections back to the pool
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
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
