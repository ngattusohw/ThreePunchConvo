import { config } from "dotenv";
import { resolve } from "path";

import { db } from "./db";
import * as createNotificationsTableMigration from "./migrations/0011_create_notifications_table";

async function migrateNotifications() {
  try {
    console.log("Running notifications table migration...");

    // Run only the notifications migration
    await createNotificationsTableMigration.up(db);

    console.log("Notifications table migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error running notifications migration:", error);
    process.exit(1);
  }
}

migrateNotifications();
