/**
 * supabase/functions/ingest-urgences/index.ts
 *
 * Hourly ingestion, triggered by pg_cron (see
 * supabase/migrations/003_ingest_cron.sql). All fetch/parse/upsert logic
 * lives in ../_shared/urgences.ts, shared with scripts/ingest.ts.
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { parse } from "npm:csv-parse@5/sync";
import { CSV_PARSE_OPTIONS, runIngest, type RawRecord } from "../_shared/urgences.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const parseCsv = (raw: string) => parse(raw, CSV_PARSE_OPTIONS) as RawRecord[];

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (_req) => {
  try {
    const { entry, source } = await runIngest(supabase, parseCsv);
    return json({ ...entry, source }, entry.success ? 200 : 500);
  } catch (err) {
    console.error("Unexpected error:", err);
    return json({ success: false, error: String(err) }, 500);
  }
});
