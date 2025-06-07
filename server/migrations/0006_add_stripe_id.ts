import { sql } from "drizzle-orm";

export async function up(db: any) {
  console.log("Running migration: Add stripe_id column to users table");

  // Add stripe_id column to users table
  await db.execute(sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS stripe_id TEXT UNIQUE;
  `);

  console.log("Migration completed: Added stripe_id column to users table");
}

export async function down(db: any) {
  console.log(
    "Running down migration: Remove stripe_id column from users table",
  );

  // Remove stripe_id column from users table
  await db.execute(sql`
    ALTER TABLE users
    DROP COLUMN IF EXISTS stripe_id;
  `);

  console.log(
    "Down migration completed: Removed stripe_id column from users table",
  );
}
