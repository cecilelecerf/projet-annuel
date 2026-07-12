import cron from "node-cron";
import { animalMeetingService } from "@api/instances";

export function startAppointmentReminderCron() {
  cron.schedule("*/15 * * * *", async () => {
    try {
      await animalMeetingService.sendDueReminders();
    } catch (err) {
      console.error("[appointment-reminder-cron] failed", err);
    }
  });
}
