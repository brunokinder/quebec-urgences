/**
 * scripts/rollup.ts
 *
 * Calls the Supabase rollup_old_snapshots() function to aggregate
 * hourly rows older than 60 days into daily summaries.
 * Run weekly via GitHub Actions.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main(): Promise<void> {
  console.log("Running weekly rollup of old hourly snapshots …");

  const { data, error } = await supabase.rpc("rollup_old_snapshots");

  if (error) {
    console.error("Rollup failed:", error.message);
    process.exit(1);
  }

  const [result] = data as { rolled_up_days: number; deleted_rows: number }[];
  console.log(`Rolled up ${result.rolled_up_days} days, deleted ${result.deleted_rows} hourly rows.`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
