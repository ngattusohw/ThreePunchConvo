import { db } from "./db";
import * as renamePotdToPinnedMigration from "./migrations/0008_rename_potd_to_pinned";

async function runRenameMigration() {
  try {
    console.log("Running POTD to PINNED_BY_USER rename migration...");

    // Only run the rename migration
    await renamePotdToPinnedMigration.up(db);

    console.log("Rename migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error running rename migration:", error);
    process.exit(1);
  }
}

runRenameMigration();
