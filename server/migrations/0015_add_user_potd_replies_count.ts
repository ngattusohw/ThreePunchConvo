import { sql } from "drizzle-orm";

export async function up(db: any) {
  // Add potd_count column to users table for tracking user's POTD reactions received
  await db.execute(sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS potd_count INTEGER NOT NULL DEFAULT 0;
  `);

  // Add replies_count column to users table for tracking replies received on user's threads
  await db.execute(sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS replies_count INTEGER NOT NULL DEFAULT 0;
  `);

  // Initialize potd_count from existing POTD reactions on user's threads
  await db.execute(sql`
    UPDATE users
    SET potd_count = (
      SELECT COALESCE(SUM(threads.potd_count), 0)
      FROM threads
      WHERE threads.user_id = users.id
    )
  `);

  // Initialize replies_count from existing replies on user's threads
  await db.execute(sql`
    UPDATE users
    SET replies_count = (
      SELECT COALESCE(SUM(threads.replies_count), 0)
      FROM threads
      WHERE threads.user_id = users.id
    )
  `);

  // Add comments to explain the new fields
  await db.execute(sql`
    COMMENT ON COLUMN users.potd_count IS 'Count of POTD reactions received on user threads';
  `);

  await db.execute(sql`
    COMMENT ON COLUMN users.replies_count IS 'Count of replies received on user threads';
  `);

  console.log("Added potd_count and replies_count columns to users table");
}

export async function down(db: any) {
  // Remove the potd_count column
  await db.execute(sql`
    ALTER TABLE users DROP COLUMN IF EXISTS potd_count;
  `);

  // Remove the replies_count column
  await db.execute(sql`
    ALTER TABLE users DROP COLUMN IF EXISTS replies_count;
  `);

  // Remove the comments
  await db.execute(sql`
    COMMENT ON COLUMN users.potd_count IS NULL;
  `);

  await db.execute(sql`
    COMMENT ON COLUMN users.replies_count IS NULL;
  `);

  console.log("Removed potd_count and replies_count columns from users table");
} 