import { pool, db } from "./db";
import * as addPotdCountMigration from "./migrations/0009_add_potd_count";

async function migratePotdCount() {
  try {
    console.log("Running POTD count migration...");
    
    // Run only the POTD count migration
    await addPotdCountMigration.up(db);
    
    console.log("POTD count migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error running POTD count migration:", error);
    process.exit(1);
  } finally {
    // Close pool
    await pool.end();
  }
}

migratePotdCount(); 