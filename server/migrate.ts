import { db } from "./db";
import * as initialMigration from "./migrations/0001_initial";

async function migrate() {
  try {
    console.log("Running migrations...");
    
    // Run migrations in order
    await initialMigration.up(db);
    
    console.log("Migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

migrate(); 