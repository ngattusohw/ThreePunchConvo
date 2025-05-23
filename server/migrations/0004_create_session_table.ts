import { sql } from "drizzle-orm";

export async function up(db: any) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_sessions (
      sid varchar NOT NULL COLLATE "default",
      sess json NOT NULL,
      expire timestamp(6) NOT NULL,
      CONSTRAINT "user_sessions_pkey" PRIMARY KEY (sid)
    ) WITH (OIDS=FALSE);

    CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON user_sessions (expire);
  `);
}

export async function down(db: any) {
  await db.execute(sql`
    DROP TABLE IF EXISTS user_sessions;
  `);
} 