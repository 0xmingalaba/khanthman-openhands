import { z } from "zod";

/**
 * Database configuration. Connection strings come from the environment and are validated
 * with Zod so a misconfigured deployment fails fast rather than at first query.
 *
 * No production provider is selected here — that remains an open owner decision.
 */
const databaseEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL must be a non-empty PostgreSQL connection string")
    .optional(),
  DATABASE_DRIVER: z.enum(["pglite", "postgres"]).default("pglite"),
  PGLITE_DATA_DIR: z.string().min(1).default("memory://"),
});

export type DatabaseConfig = {
  driver: "pglite" | "postgres";
  url?: string;
  pgliteDataDir: string;
};

export function loadDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const parsed = databaseEnvSchema.parse({
    DATABASE_URL: env.DATABASE_URL,
    DATABASE_DRIVER: env.DATABASE_DRIVER,
    PGLITE_DATA_DIR: env.PGLITE_DATA_DIR,
  });

  if (parsed.DATABASE_DRIVER === "postgres" && !parsed.DATABASE_URL) {
    throw new Error("DATABASE_DRIVER=postgres requires DATABASE_URL to be set.");
  }

  return {
    driver: parsed.DATABASE_DRIVER,
    url: parsed.DATABASE_URL,
    pgliteDataDir: parsed.PGLITE_DATA_DIR,
  };
}
