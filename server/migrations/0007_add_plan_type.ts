import { sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";

export async function up(db: PgDatabase<any, any, any>) {
  console.log("Running migration: add plan_type to users table");
  
  // Add plan_type column to users table if it doesn't exist
  await db.execute(sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'FREE';
    
    -- Create index for faster queries on plan_type
    CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);
    
    -- Add comment to column for documentation
    COMMENT ON COLUMN users.plan_type IS 'User subscription plan type: FREE, BASIC, PRO';
  `);
  
  console.log("Migration complete: added plan_type to users table");
}

export async function down(db: PgDatabase<any, any, any>) {
  console.log("Running down migration: remove plan_type from users table");
  
  // Drop the index first
  await db.execute(sql`DROP INDEX IF EXISTS idx_users_plan_type;`);
  
  // Drop the column
  await db.execute(sql`ALTER TABLE users DROP COLUMN IF EXISTS plan_type;`);
  
  console.log("Down migration complete: removed plan_type from users table");
} 