import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mode = process.env.NODE_ENV === "production" ? "prod" : "dev";
config({ path: resolve(__dirname, `../../../.env.${mode}`) });
