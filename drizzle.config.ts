import "dotenv/config";               // <-- load .env when running drizzle commands
import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",      // or wherever your schema file really lives
  out: "./drizzle",
  dialect: "postgresql",              // <-- IMPORTANT: use Postgres, not MySQL
  dbCredentials: {
    url: connectionString,
  },
});
