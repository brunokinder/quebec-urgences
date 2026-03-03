/**
 * scripts/ingest.ts
 *
 * Fetches the MSSS hourly CSV, parses it, and upserts into Supabase.
 * Run via: pnpm ingest
 * Also called by GitHub Actions every hour.
 */

import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import * as fs from "node:fs";
import * as path from "node:path";
import { MSSS_CSV_URL } from "../packages/shared/src/constants.js";
import type { UrgenceRow, IngestResult } from "../packages/shared/src/types.js";

// ─── Config ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── CSV column name → our field mapping ────────────────────────────────────

// The CSV uses French column headers. We map them to our schema fields.
// Adjust if MSSS changes their column names.
const COLUMN_MAP: Record<string, keyof UrgenceRow> = {
  "Nom de l'installation": "nom_installation",
  "Région sociosanitaire": "region",
  "Nombre de civières fonctionnelles": "nb_civieres",
  "Nombre de patients sur civières": "nb_patients_civieres",
  "Taux d'occupation des civières (%)": "taux_occupation",
  "Nombre de patients sur civières depuis plus de 24h": "nb_patients_civieres_24h",
  "Nombre de patients sur civières depuis plus de 48h": "nb_patients_civieres_48h",
  "Nombre de personnes présentes": "nb_personnes_presentes",
  "Nombre de personnes en cours d'évaluation (PEC)": "nb_pec",
  "Durée moyenne de séjour - ambulatoire (h)": "dms_ambulatoire",
  "Durée moyenne de séjour - civières (h)": "dms_civieres",
};

// Timestamp column in the CSV
const TIMESTAMP_COL = "Heure du relevé";

// ─── Helpers ────────────────────────────────────────────────────────────────

function toNum(value: string | undefined): number | null {
  if (value === undefined || value === "" || value === "N/D") return null;
  const n = parseFloat(value.replace(",", "."));
  return isNaN(n) ? null : n;
}

function toInt(value: string | undefined): number | null {
  if (value === undefined || value === "" || value === "N/D") return null;
  const n = parseInt(value, 10);
  return isNaN(n) ? null : n;
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

async function fetchCsv(): Promise<string> {
  console.log(`Fetching CSV from ${MSSS_CSV_URL} …`);
  const response = await fetch(MSSS_CSV_URL, {
    headers: {
      // Some servers reject requests without a User-Agent
      "User-Agent": "urgences-quebec-bot/1.0 (github.com/bkindera/urgences-quebec)",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} — ${response.statusText}`);
  }

  // The CSV is Latin-1 / Windows-1252 encoded
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder("windows-1252");
  return decoder.decode(buffer);
}

// ─── Parse ───────────────────────────────────────────────────────────────────

interface ParsedRow {
  timestamp: string;
  nom_installation: string;
  region: string;
  nb_civieres: number | null;
  nb_patients_civieres: number | null;
  taux_occupation: number | null;
  nb_patients_civieres_24h: number | null;
  nb_patients_civieres_48h: number | null;
  nb_personnes_presentes: number | null;
  nb_pec: number | null;
  dms_ambulatoire: number | null;
  dms_civieres: number | null;
}

function parseCsv(raw: string): ParsedRow[] {
  const records: Record<string, string>[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ";",
    trim: true,
    bom: true,
  });

  if (records.length === 0) {
    throw new Error("CSV is empty — possible format change.");
  }

  const firstRow = records[0];
  const csvCols = Object.keys(firstRow);

  // Validate required columns exist
  const requiredCols = [TIMESTAMP_COL, ...Object.keys(COLUMN_MAP)];
  const missing = requiredCols.filter((c) => !csvCols.includes(c));
  if (missing.length > 0) {
    console.warn(`WARNING: Missing CSV columns: ${missing.join(", ")}`);
    console.warn(`Available columns: ${csvCols.join(", ")}`);
  }

  return records.map((row) => ({
    timestamp: row[TIMESTAMP_COL] ?? "",
    nom_installation: row[COLUMN_MAP["Nom de l'installation"] ?? ""] ?? row["Nom de l'installation"] ?? "",
    region: row[COLUMN_MAP["Région sociosanitaire"] ?? ""] ?? row["Région sociosanitaire"] ?? "",
    nb_civieres: toInt(row["Nombre de civières fonctionnelles"]),
    nb_patients_civieres: toInt(row["Nombre de patients sur civières"]),
    taux_occupation: toNum(row["Taux d'occupation des civières (%)"]),
    nb_patients_civieres_24h: toInt(row["Nombre de patients sur civières depuis plus de 24h"]),
    nb_patients_civieres_48h: toInt(row["Nombre de patients sur civières depuis plus de 48h"]),
    nb_personnes_presentes: toInt(row["Nombre de personnes présentes"]),
    nb_pec: toInt(row["Nombre de personnes en cours d'évaluation (PEC)"]),
    dms_ambulatoire: toNum(row["Durée moyenne de séjour - ambulatoire (h)"]),
    dms_civieres: toNum(row["Durée moyenne de séjour - civières (h)"]),
  })).filter((r) => r.nom_installation && r.timestamp);
}

// ─── Archive raw CSV ─────────────────────────────────────────────────────────

function archiveCsv(raw: string, fetchedAt: Date): void {
  const year = fetchedAt.getUTCFullYear();
  const month = String(fetchedAt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(fetchedAt.getUTCDate()).padStart(2, "0");
  const hour = String(fetchedAt.getUTCHours()).padStart(2, "0");

  const dir = path.join("data", String(year), month);
  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${day}T${hour}00Z.csv`);
  fs.writeFileSync(filePath, raw, "utf-8");
  console.log(`Archived CSV to ${filePath}`);
}

// ─── Upsert ──────────────────────────────────────────────────────────────────

const BATCH_SIZE = 100;

async function upsert(rows: ParsedRow[]): Promise<{ inserted: number; skipped: number; errors: number }> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const { error, count } = await supabase
      .from("urgences_snapshots")
      .upsert(batch, {
        onConflict: "nom_installation,timestamp",
        ignoreDuplicates: true,
        count: "exact",
      });

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message);
      errors += batch.length;
    } else {
      inserted += count ?? 0;
      skipped += batch.length - (count ?? 0);
    }
  }

  return { inserted, skipped, errors };
}

// ─── Log result to DB ────────────────────────────────────────────────────────

async function logResult(result: IngestResult & { success: boolean; message?: string }): Promise<void> {
  const { error } = await supabase.from("ingestion_log").insert({
    fetched_at: result.fetched_at,
    row_count: result.row_count,
    inserted: result.inserted,
    skipped: result.skipped,
    errors: result.errors,
    success: result.success,
    message: result.message,
  });

  if (error) {
    console.error("Failed to write ingestion log:", error.message);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const fetchedAt = new Date();
  console.log(`\n=== Urgences Québec — Ingest [${fetchedAt.toISOString()}] ===\n`);

  let raw: string;
  try {
    raw = await fetchCsv();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Fetch failed:", message);
    await logResult({ fetched_at: fetchedAt.toISOString(), row_count: 0, inserted: 0, skipped: 0, errors: 1, success: false, message });
    process.exit(1);
  }

  let rows: ParsedRow[];
  try {
    rows = parseCsv(raw);
    console.log(`Parsed ${rows.length} rows.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Parse failed:", message);
    await logResult({ fetched_at: fetchedAt.toISOString(), row_count: 0, inserted: 0, skipped: 0, errors: 1, success: false, message });
    process.exit(1);
  }

  // Archive raw file (best-effort — don't fail ingest if this fails)
  try {
    archiveCsv(raw, fetchedAt);
  } catch (err) {
    console.warn("Archive failed (non-fatal):", err instanceof Error ? err.message : err);
  }

  const { inserted, skipped, errors } = await upsert(rows);

  const result: IngestResult & { success: boolean } = {
    fetched_at: fetchedAt.toISOString(),
    row_count: rows.length,
    inserted,
    skipped,
    errors,
    success: errors === 0,
  };

  await logResult(result);

  console.log(`\nDone. inserted=${inserted} skipped=${skipped} errors=${errors}\n`);

  if (errors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
