import { sql } from "drizzle-orm";

export async function up(db: any) {
  console.log("Running migration: Add Clerk external_id column to users table");

  // Add external_id column to users table
  await db.execute(sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
  `);

  console.log("Migration completed: Added external_id column to users table");
}

export async function down(db: any) {
  console.log(
    "Running down migration: Remove external_id column from users table",
  );

  // Remove external_id column from users table
  await db.execute(sql`
    ALTER TABLE users
    DROP COLUMN IF EXISTS external_id;
  `);

  console.log(
    "Down migration completed: Removed external_id column from users table",
  );
}
