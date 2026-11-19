/**
 * scripts/ingest.ts
 *
 * Fetches the MSSS emergency-room data and upserts it into Supabase.
 * All fetch/parse/upsert logic lives in supabase/functions/_shared/urgences.ts,
 * shared with the ingest-urgences Edge Function (pg_cron).
 *
 * Run via: pnpm ingest
 * Also run hourly by GitHub Actions unless INGEST_VIA_PG_CRON=true.
 *
 * Environment: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { CSV_PARSE_OPTIONS, runIngest, type RawRecord } from "../supabase/functions/_shared/urgences.ts";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const parseCsv = (raw: string) => parse(raw, CSV_PARSE_OPTIONS) as RawRecord[];

runIngest(supabase, parseCsv)
  .then(({ entry }) => {
    if (!entry.success) process.exit(1);
  })
  .catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });
