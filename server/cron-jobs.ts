import cron from "node-cron";
import { storage } from "./storage";

/**
 * Setup all cron jobs for the application
 */
export function setupCronJobs(): void {
  // Recalculate all user statuses at 2 AM every day
  // The syntax is: minute hour day-of-month month day-of-week
  cron.schedule("0 2 * * *", async () => {
    console.log("Running scheduled job: recalculateAllUserStatuses");
    try {
      const result = await storage.recalculateAllUserStatuses();
      console.log(
        `User status recalculation job completed: ${result.success} updated, ${result.unchanged} unchanged, ${result.failed} failed`,
      );
    } catch (error) {
      console.error("Error running user status recalculation job:", error);
    }
  });

  // Recalculate user rankings at 3 AM every day
  cron.schedule("0 3 * * *", async () => {
    console.log("Running scheduled job: recalculateRankings");
    try {
      await storage.recalculateRankings();
      console.log("User ranking recalculation job completed");
    } catch (error) {
      console.error("Error running user ranking recalculation job:", error);
    }
  });

  console.log("Cron jobs initialized");
}
