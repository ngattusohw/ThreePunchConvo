import { sql } from "drizzle-orm";

export async function up(db: any) {
  // Create notifications table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      related_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      thread_id TEXT REFERENCES threads(id) ON DELETE CASCADE,
      reply_id TEXT REFERENCES replies(id) ON DELETE CASCADE,
      message TEXT,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create indexes for better query performance
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);`,
  );
}

export async function down(db: any) {
  // Drop indexes first
  await db.execute(sql`DROP INDEX IF EXISTS idx_notifications_is_read;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_notifications_created_at;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_notifications_type;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_notifications_user_id;`);

  // Drop table
  await db.execute(sql`DROP TABLE IF EXISTS notifications;`);
}
