import { sql } from "drizzle-orm";

export async function up(db) {
  // Add potdCount column with SQL
  await db.execute(sql`
    ALTER TABLE threads 
    ADD COLUMN IF NOT EXISTS "potd_count" integer NOT NULL DEFAULT 0
  `);
  
  // Initialize the potdCount from existing POTD reactions
  await db.execute(sql`
    UPDATE threads
    SET "potd_count" = (
      SELECT COUNT(*)
      FROM thread_reactions
      WHERE thread_reactions.type = 'POTD' AND thread_reactions."thread_id" = threads.id
    )
  `);
}

export async function down(db) {
  // Drop potdCount column with SQL
  await db.execute(sql`
    ALTER TABLE threads
    DROP COLUMN IF EXISTS "potd_count"
  `);
} 