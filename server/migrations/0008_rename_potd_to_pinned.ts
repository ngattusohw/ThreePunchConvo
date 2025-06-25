import { sql } from "drizzle-orm";

export async function up(db: any) {
  // Rename potd_count to pinned_by_user_count in users table
  await db.execute(sql`
    ALTER TABLE users RENAME COLUMN potd_count TO pinned_by_user_count;
  `);

  // Rename is_potd to is_pinned_by_user in threads table
  await db.execute(sql`
    ALTER TABLE threads RENAME COLUMN is_potd TO is_pinned_by_user;
  `);

  // Update the thread_reactions table to change POTD to PINNED_BY_USER
  await db.execute(sql`
    UPDATE thread_reactions SET type = 'PINNED_BY_USER' WHERE type = 'POTD';
  `);
}

export async function down(db: any) {
  // Revert changes
  await db.execute(sql`
    ALTER TABLE users RENAME COLUMN pinned_by_user_count TO potd_count;
  `);

  await db.execute(sql`
    ALTER TABLE threads RENAME COLUMN is_pinned_by_user TO is_potd;
  `);

  await db.execute(sql`
    UPDATE thread_reactions SET type = 'POTD' WHERE type = 'PINNED_BY_USER';
  `);
}
