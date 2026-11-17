import { pgTable, text, timestamp, uuid, integer, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Non-financial foundation schema (M1).
 *
 * SCOPE: these tables support presentation and preferences only. There are NO ledger,
 * balance, journal, order, trade, position, or settlement tables — those belong to
 * Milestone 4 and are gated behind financial-specification approval.
 *
 * Portability: the definitions use only plain PostgreSQL types (uuid, text, integer,
 * boolean, timestamptz) so the same migration runs on PGlite and a real PostgreSQL server.
 */

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    nameEn: text("name_en").notNull(),
    nameMy: text("name_my").notNull(),
    descriptionEn: text("description_en"),
    descriptionMy: text("description_my"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("categories_slug_key").on(table.slug)],
);

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const schemaMigrations = pgTable(
  "schema_migrations",
  {
    id: text("id").primaryKey(),
    appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("schema_migrations_applied_at_idx").on(table.appliedAt)],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type AppSetting = typeof appSettings.$inferSelect;
