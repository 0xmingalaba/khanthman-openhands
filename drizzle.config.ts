import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config. Used to generate and inspect migrations.
 * Local development and CI use PGlite; `dialect: "postgresql"` keeps the generated SQL
 * portable to a real PostgreSQL server.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  casing: "snake_case",
});
