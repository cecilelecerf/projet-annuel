import "./env"; // doit rester en premier — charge le .env avant tout le reste
import "./lib/sentry"; // capture des erreurs — doit être initialisé avant le reste
import { createServer } from "http";
import { app } from "./app";
import { initSocketGateway } from "./messaging/socket.gateway";
import { startAppointmentReminderCron } from "./cron/appointment-reminder.cron";

const httpServer = createServer(app);
initSocketGateway(httpServer);
startAppointmentReminderCron();

httpServer.listen(3001, () =>
  console.log(`
🚀 Server ready at: http://localhost:3001`),
);
