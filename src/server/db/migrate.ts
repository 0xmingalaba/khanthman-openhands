import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sql } from "drizzle-orm";
import type { Database, DatabaseHandle } from "@/server/db/client";

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "migrations");

export type MigrationRecord = { id: string; applied: boolean };

async function ensureMigrationsTable(db: Database): Promise<void> {
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS "schema_migrations" (
       "id" text PRIMARY KEY,
       "applied_at" timestamptz NOT NULL DEFAULT now()
     )`,
  );
}

async function appliedIds(db: Database): Promise<Set<string>> {
  const result = await db.execute<{ id: string }>(sql`SELECT "id" FROM "schema_migrations"`);
  return new Set(result.rows.map((row) => row.id));
}

export async function listMigrationFiles(): Promise<string[]> {
  const files = await readdir(MIGRATIONS_DIR);
  return files.filter((file) => file.endsWith(".sql")).sort();
}

/**
 * Apply all pending migrations in filename order.
 *
 * Idempotent: already-applied migrations are skipped. Each script runs through the handle's
 * raw `exec` because a script holds several statements and a prepared statement accepts only
 * one. Scripts are written with `IF NOT EXISTS` guards, so a partially-applied script can be
 * re-run safely without an explicit transaction. Bookkeeping happens only after a script
 * succeeds, so a failed script is retried on the next run.
 */
export async function runMigrations(handle: DatabaseHandle): Promise<MigrationRecord[]> {
  const { db, exec } = handle;
  await ensureMigrationsTable(db);
  const applied = await appliedIds(db);
  const files = await listMigrationFiles();
  const records: MigrationRecord[] = [];

  for (const file of files) {
    if (applied.has(file)) {
      records.push({ id: file, applied: false });
      continue;
    }
    const script = await readFile(join(MIGRATIONS_DIR, file), "utf8");
    await exec(script);
    await db.execute(sql`INSERT INTO "schema_migrations" ("id") VALUES (${file})`);
    records.push({ id: file, applied: true });
  }

  return records;
}
