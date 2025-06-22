import { db } from "./db";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

async function runMigration() {
  const migrationName = process.argv[2];

  if (!migrationName) {
    console.error("Usage: npm run migrate:run <migration-name>");
    console.error("Example: npm run migrate:run 0012_add_pinned_count");
    process.exit(1);
  }

  // Get the current directory for ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Construct the migration file path
  const migrationPath = path.join(
    __dirname,
    "migrations",
    `${migrationName}.ts`,
  );

  // Check if the migration file exists
  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  try {
    console.log(`Running migration: ${migrationName}`);

    // Dynamically import the migration
    const migration = await import(`./migrations/${migrationName}.ts`);

    // Run the migration
    await migration.up(db);

    console.log(`Migration ${migrationName} completed successfully!`);
    process.exit(0);
  } catch (error) {
    console.error(`Error running migration ${migrationName}:`, error);
    process.exit(1);
  }
}

runMigration();
