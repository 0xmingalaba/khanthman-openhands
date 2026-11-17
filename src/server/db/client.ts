import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzleNodePg, type NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { loadDatabaseConfig, type DatabaseConfig } from "@/server/db/config";
import * as schema from "@/server/db/schema";

/**
 * A driver-agnostic database handle.
 *
 * Both PGlite and node-postgres are `PgDatabase` instances. We anchor the public type on
 * the node-postgres result kind (the production target) so raw `execute` results are typed
 * with `.rows`. The PGlite handle satisfies the same runtime shape (`execute`, `transaction`,
 * `select`, `insert`, ...) and is adapted below.
 */
export type Database = PgDatabase<NodePgQueryResultHKT, typeof schema>;

export type DatabaseHandle = {
  db: Database;
  driver: DatabaseConfig["driver"];
  /**
   * Run one or more SQL statements as a single script.
   *
   * Drizzle's `execute` wraps a statement in a prepared statement, which PostgreSQL only
   * accepts for a single command. Migration scripts contain several statements, so they use
   * this raw path instead (`PGlite.exec` / `pg.Pool.query`, both of which accept scripts).
   */
  exec: (sqlText: string) => Promise<void>;
  close: () => Promise<void>;
};

/**
 * Create a database connection for the given config.
 * - `pglite` uses in-memory or on-disk PGlite (development and tests).
 * - `postgres` uses node-postgres against a real server (production target).
 */
export async function createDatabase(
  config: DatabaseConfig = loadDatabaseConfig(),
): Promise<DatabaseHandle> {
  if (config.driver === "postgres") {
    const pool = new Pool({ connectionString: config.url });
    const db = drizzleNodePg(pool, { schema });
    return {
      db: db as unknown as Database,
      driver: "postgres",
      exec: async (sqlText) => {
        await pool.query(sqlText);
      },
      close: async () => {
        await pool.end();
      },
    };
  }

  const client = new PGlite(config.pgliteDataDir);
  await client.waitReady;
  const db = drizzlePglite(client, { schema });
  return {
    db: db as unknown as Database,
    driver: "pglite",
    exec: async (sqlText) => {
      await client.exec(sqlText);
    },
    close: async () => {
      await client.close();
    },
  };
}
