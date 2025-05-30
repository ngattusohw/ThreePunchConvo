import { db } from "./db";
import * as initialMigration from "./migrations/0001_initial";
import * as addMissingTablesMigration from "./migrations/0002_add_missing_tables";
import * as addReactionTablesMigration from "./migrations/0003_add_reactions_tables";
import * as createSessionTableMigration from "./migrations/0004_create_session_table";
import * as addClerkExternalIdMigration from "./migrations/0005_add_clerk_external_id";

async function migrate() {
  try {
    console.log("Running migrations...");
    
    // Run migrations in order
    await initialMigration.up(db);
    await addMissingTablesMigration.up(db);
    await addReactionTablesMigration.up(db);
    await createSessionTableMigration.up(db);
    await addClerkExternalIdMigration.up(db);
    
    console.log("Migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

migrate(); 