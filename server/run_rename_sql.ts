import { db } from "./db";
import { sql } from 'drizzle-orm';

async function runRenameSql() {
  try {
    console.log("Running POTD to PINNED_BY_USER rename SQL...");
    
    // Rename potd_count to pinned_by_user_count in users table
    await db.execute(sql`
      ALTER TABLE users RENAME COLUMN potd_count TO pinned_by_user_count;
    `);
    console.log("Renamed users.potd_count to users.pinned_by_user_count");

    // Rename is_potd to is_pinned_by_user in threads table
    await db.execute(sql`
      ALTER TABLE threads RENAME COLUMN is_potd TO is_pinned_by_user;
    `);
    console.log("Renamed threads.is_potd to threads.is_pinned_by_user");

    // Update the thread_reactions table to change POTD to PINNED_BY_USER
    await db.execute(sql`
      UPDATE thread_reactions SET type = 'PINNED_BY_USER' WHERE type = 'POTD';
    `);
    console.log("Updated thread_reactions: POTD → PINNED_BY_USER");
    
    console.log("Rename SQL completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error running rename SQL:", error);
    process.exit(1);
  }
}

runRenameSql(); 