import { sql } from "drizzle-orm";
import { polls, pollOptions, threadMedia } from "@shared/schema";

export async function up(db: any) {
  // Create thread_media table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS thread_media (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create polls table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS polls (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      expires_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      votes_count INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Create poll_options table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS poll_options (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      votes_count INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Create poll_votes table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS poll_votes (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      poll_option_id TEXT NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create indexes for better query performance
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_polls_thread_id ON polls(thread_id);`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_thread_media_thread_id ON thread_media(thread_id);`,
  );
}

export async function down(db: any) {
  // Drop indexes first
  await db.execute(sql`DROP INDEX IF EXISTS idx_thread_media_thread_id;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_poll_options_poll_id;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_polls_thread_id;`);

  // Drop tables in reverse order to handle dependencies
  await db.execute(sql`DROP TABLE IF EXISTS poll_votes;`);
  await db.execute(sql`DROP TABLE IF EXISTS poll_options;`);
  await db.execute(sql`DROP TABLE IF EXISTS polls;`);
  await db.execute(sql`DROP TABLE IF EXISTS thread_media;`);
}
