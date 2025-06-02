import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env file
const rootDir = process.cwd();
config({ path: path.resolve(rootDir, '.env') });
import pkg from 'pg';
const { Pool } = pkg;
// import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres'; // Changed from neon-serverless
import * as schema from '@shared/schema';

// Removed Neon-specific WebSocket config

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
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
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

// Add connection handler
pool.on('connect', (client) => {
  console.log('New database connection established');
});

export const db = drizzle(pool, { schema }); // Different syntax for node-postgres

// Export a function to check and refresh the connection if needed
export async function ensureConnection() {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
}
