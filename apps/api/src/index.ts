import "./env"; // doit rester en premier — charge le .env avant tout le reste
import { app } from "./app";

app.listen(3001, () =>
  console.log(`
🚀 Server ready at: http://localhost:3001`),
);
