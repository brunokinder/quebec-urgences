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

// As of 2026-03 the MSSS CSV uses comma-delimited snake_case English headers.
// taux_occupation is not provided — computed from occupees / fonctionnelles.
// Adjust if MSSS changes their column names again.
const TIMESTAMP_COL = "Mise_a_jour";

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

// CSV timestamp format is "2026-03-03T8:45" — pad hour to get valid ISO.
function parseTimestamp(value: string): string {
  if (!value) return "";
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return value;
  const [hours, minutes] = timePart.split(":");
  return `${datePart}T${(hours ?? "0").padStart(2, "0")}:${(minutes ?? "00").padStart(2, "0")}:00`;
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

async function fetchCsv(): Promise<string> {
  console.log(`Fetching CSV from ${MSSS_CSV_URL} …`);
  const response = await fetch(MSSS_CSV_URL, {
    headers: {
      "User-Agent": "quebec-urgences-bot/1.0 (github.com/brunokinder/quebec-urgences)",
      // Referer and Accept are required by the MSSS server — omitting them
      // causes a 403, particularly from CI/cloud IP ranges.
      "Referer": "https://msss.gouv.qc.ca/professionnels/statistiques/documents/urgences/",
      "Accept": "text/csv,text/plain,*/*",
      "Accept-Language": "fr-CA,fr;q=0.9",
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
    delimiter: ",",
    trim: true,
    bom: true,
  });

  if (records.length === 0) {
    throw new Error("CSV is empty — possible format change.");
  }

  const csvCols = Object.keys(records[0]);
  const requiredCols = [
    TIMESTAMP_COL,
    "Nom_installation",
    "Region",
    "Nombre_de_civieres_fonctionnelles",
    "Nombre_de_civieres_occupees",
  ];
  const missing = requiredCols.filter((c) => !csvCols.includes(c));
  if (missing.length > 0) {
    console.warn(`WARNING: Missing CSV columns: ${missing.join(", ")}`);
    console.warn(`Available columns: ${csvCols.join(", ")}`);
  }

  return records
    .map((row) => {
      const nbCivieres = toInt(row["Nombre_de_civieres_fonctionnelles"]);
      const nbOccupees = toInt(row["Nombre_de_civieres_occupees"]);
      const taux =
        nbCivieres && nbCivieres > 0 && nbOccupees !== null
          ? Math.round((nbOccupees / nbCivieres) * 10000) / 100
          : null;

      return {
        timestamp: parseTimestamp(row[TIMESTAMP_COL] ?? ""),
        nom_installation: row["Nom_installation"] ?? "",
        region: row["Region"] ?? "",
        nb_civieres: nbCivieres,
        nb_patients_civieres: nbOccupees,
        taux_occupation: taux,
        nb_patients_civieres_24h: toInt(row["Nombre_de_patients_sur_civiere_plus_de_24_heures"]),
        nb_patients_civieres_48h: toInt(row["Nombre_de_patients_sur_civiere_plus_de_48_heures"]),
        nb_personnes_presentes: toInt(row["Nombre_total_de_patients_presents_a_lurgence"]),
        nb_pec: toInt(row["Nombre_total_de_patients_en_attente_de_PEC"]),
        dms_ambulatoire: toNum(row["DMS_ambulatoire"]),
        dms_civieres: toNum(row["DMS_sur_civiere"]),
      };
    })
    .filter((r) => r.nom_installation && r.nom_installation !== "Total régional" && r.timestamp);
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
