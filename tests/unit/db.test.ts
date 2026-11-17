import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { createDatabase, type DatabaseHandle } from "@/server/db/client";
import { listMigrationFiles, runMigrations } from "@/server/db/migrate";

/**
 * Migration tests run against PGlite (PostgreSQL 18.x WASM, single connection).
 * This is mechanism evidence for the migration runner only; it is not real PostgreSQL
 * multi-session concurrency evidence.
 */
describe("database foundation (PGlite)", () => {
  let handle: DatabaseHandle;

  beforeAll(async () => {
    handle = await createDatabase({ driver: "pglite", pgliteDataDir: "memory://" });
  }, 30_000);

  afterAll(async () => {
    await handle.close();
  });

  it("ships at least one migration", async () => {
    const files = await listMigrationFiles();
    expect(files.length).toBeGreaterThan(0);
  });

  it("applies migrations and records them", async () => {
    const first = await runMigrations(handle);
    expect(first.length).toBeGreaterThan(0);
    expect(first.every((record) => record.applied)).toBe(true);

    const second = await runMigrations(handle);
    expect(second.every((record) => record.applied === false)).toBe(true);
  });

  it("creates the non-financial tables", async () => {
    const result = await handle.db.execute<{ table_name: string }>(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    );
    const names = result.rows.map((row) => row.table_name);
    expect(names).toContain("categories");
    expect(names).toContain("app_settings");
    expect(names).toContain("schema_migrations");
  });

  it("does NOT create any financial tables", async () => {
    const result = await handle.db.execute<{ table_name: string }>(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    );
    const names = result.rows.map((row) => row.table_name).join(" ");
    for (const forbidden of [
      "ledger_accounts",
      "ledger_journals",
      "ledger_entries",
      "balances",
      "orders",
      "trades",
      "positions",
      "settlement_payouts",
      "settlement_entitlements",
      "corrections",
    ]) {
      expect(names).not.toContain(forbidden);
    }
  });

  it("enforces the unique slug constraint", async () => {
    await handle.db.execute(
      sql`INSERT INTO "categories" ("slug", "name_en", "name_my") VALUES ('politics', 'Politics', 'နိုင်ငံရေး')`,
    );
    await expect(
      handle.db.execute(
        sql`INSERT INTO "categories" ("slug", "name_en", "name_my") VALUES ('politics', 'Dup', 'Dup')`,
      ),
    ).rejects.toThrow();
  });
});
