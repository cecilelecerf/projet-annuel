import "./env"; // doit rester en premier — charge le .env avant tout le reste
import { createServer } from "http";
import { app } from "./app";
import { initSocketGateway } from "./messaging/socket.gateway";

const httpServer = createServer(app);
initSocketGateway(httpServer);

httpServer.listen(3001, () =>
  console.log(`
🚀 Server ready at: http://localhost:3001`),
);
