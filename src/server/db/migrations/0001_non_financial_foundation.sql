-- Migration 0001: non-financial foundation.
-- Scope: presentation and preference tables only. No ledger, balance, order, trade,
-- position, or settlement tables (those belong to Milestone 4, gated on financial-spec approval).
-- Plain PostgreSQL DDL only, so this runs unchanged on PGlite and a real PostgreSQL server.

CREATE TABLE IF NOT EXISTS "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL,
  "name_en" text NOT NULL,
  "name_my" text NOT NULL,
  "description_en" text,
  "description_my" text,
  "sort_order" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_key" ON "categories" ("slug");

CREATE TABLE IF NOT EXISTS "app_settings" (
  "key" text PRIMARY KEY,
  "value" text NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
