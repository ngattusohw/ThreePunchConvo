import { db } from "./db";
import * as initialMigration from "./migrations/0001_initial";
import * as addMissingTablesMigration from "./migrations/0002_add_missing_tables";
import * as addReactionTablesMigration from "./migrations/0003_add_reactions_tables";
import * as createSessionTableMigration from "./migrations/0004_create_session_table";
import * as addClerkExternalIdMigration from "./migrations/0005_add_clerk_external_id";
import * as addStripeIdMigration from "./migrations/0006_add_stripe_id";
import * as addPlanTypeMigration from "./migrations/0007_add_plan_type";
import * as renamePotdToPinnedMigration from "./migrations/0008_rename_potd_to_pinned";
import * as addPotdCountMigration from "./migrations/0009_add_potd_count";
import * as createNotificationsTableMigration from "./migrations/0011_create_notifications_table";

async function migrate() {
  try {
    console.log("Running migrations...");

    // Run migrations in order
    await initialMigration.up(db);
    await addMissingTablesMigration.up(db);
    await addReactionTablesMigration.up(db);
    await createSessionTableMigration.up(db);
    await addClerkExternalIdMigration.up(db);
    await addStripeIdMigration.up(db);
    await addPlanTypeMigration.up(db);
    await renamePotdToPinnedMigration.up(db);
    await addPotdCountMigration.up(db);
    await createNotificationsTableMigration.up(db);

    console.log("Migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

migrate();
