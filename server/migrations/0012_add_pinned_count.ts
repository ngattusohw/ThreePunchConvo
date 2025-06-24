import { sql } from "drizzle-orm";

export async function up(db: any) {
  // Add pinned_count column to users table for tracking global admin pinning
  await db.execute(sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS pinned_count INTEGER NOT NULL DEFAULT 0;
  `);

  // Add comments to explain the difference between the two pinning fields
  await db.execute(sql`
    COMMENT ON COLUMN users.pinned_by_user_count IS 'Legacy field: Count of threads pinned by users (old system)';
  `);

  await db.execute(sql`
    COMMENT ON COLUMN users.pinned_count IS 'Count of threads pinned globally by admins (new system)';
  `);

  console.log("Added pinned_count column to users table");
}

export async function down(db: any) {
  // Remove the pinned_count column
  await db.execute(sql`
    ALTER TABLE users DROP COLUMN IF EXISTS pinned_count;
  `);

  // Remove the comments
  await db.execute(sql`
    COMMENT ON COLUMN users.pinned_by_user_count IS NULL;
  `);

  console.log("Removed pinned_count column from users table");
}
