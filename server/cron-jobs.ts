import cron from "node-cron";
import { storage } from "./storage";

/**
 * Setup all cron jobs for the application
 */
export function setupCronJobs(): void {
  // Recalculate fighter cred at 2 AM EST every day
  cron.schedule(
    "0 5 * * *",
    async () => {
      console.log("Running scheduled job: recalculateFighterCred");
      try {
        await storage.recalculateFighterCred();
        console.log("Fighter cred recalculation job completed");
      } catch (error) {
        console.error("Error running fighter cred recalculation job:", error);
      }
    },
    {
      timezone: "America/New_York", // This ensures EST/EDT (Eastern Time)
    },
  );

  console.log("Cron jobs initialized");
}
