import { sql } from "drizzle-orm";

export async function up(db: any) {
  // Create thread_reactions table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS thread_reactions (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create reply_reactions table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS reply_reactions (
      id TEXT PRIMARY KEY,
      reply_id TEXT NOT NULL REFERENCES replies(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create indexes for better query performance
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_thread_reactions_thread_id ON thread_reactions(thread_id);`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_thread_reactions_user_id ON thread_reactions(user_id);`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_thread_reactions_type ON thread_reactions(type);`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_reply_reactions_reply_id ON reply_reactions(reply_id);`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_reply_reactions_user_id ON reply_reactions(user_id);`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_reply_reactions_type ON reply_reactions(type);`,
  );

  // Create unique constraint to prevent duplicate reactions
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_thread_reaction 
    ON thread_reactions(thread_id, user_id, type);
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_reply_reaction 
    ON reply_reactions(reply_id, user_id, type);
  `);
}

export async function down(db: any) {
  // Drop tables and their indexes (CASCADE will handle the indexes)
  await db.execute(sql`DROP TABLE IF EXISTS thread_reactions CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS reply_reactions CASCADE;`);
}
