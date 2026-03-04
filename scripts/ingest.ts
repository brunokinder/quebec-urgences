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
import { CKAN_API_URL, MSSS_CSV_URL } from "../packages/shared/src/constants.js";
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

// MSSS timestamps are in Quebec local time (America/Toronto) with no offset,
// e.g. "2026-03-03T8:45". We pad the hour and append the correct UTC offset
// (EST −05:00 or EDT −04:00) so the value stored in the DB is unambiguous.
function quebecUtcOffset(date: Date): string {
  // Intl gives us e.g. "GMT-5" or "GMT-4" for the given instant
  const part = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    timeZoneName: "shortOffset",
  })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName")?.value ?? "GMT-5";
  const match = part.match(/GMT([+-]?\d+)/);
  const h = match ? parseInt(match[1], 10) : -5;
  const sign = h <= 0 ? "-" : "+";
  return `${sign}${String(Math.abs(h)).padStart(2, "0")}:00`;
}

function parseTimestamp(value: string): string {
  if (!value) return "";
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return value;
  const [hours, minutes] = timePart.split(":");
  const padded = `${datePart}T${(hours ?? "0").padStart(2, "0")}:${(minutes ?? "00").padStart(2, "0")}:00`;
  const offset = quebecUtcOffset(new Date(padded));
  return `${padded}${offset}`;
}

// ─── CKAN API types ─────────────────────────────────────────────────────────

interface CkanRecord {
  [key: string]: string | number | null;
}

interface CkanResponse {
  success: boolean;
  result: {
    records: CkanRecord[];
    total: number;
  };
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

/** Primary source: Données Québec CKAN API (public, no rate limits). */
async function fetchCkan(): Promise<CkanRecord[]> {
  const url = `${CKAN_API_URL}&limit=300`;
  console.log(`Fetching from CKAN API …`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`CKAN HTTP ${response.status} — ${response.statusText}`);
  }

  const json = (await response.json()) as CkanResponse;
  if (!json.success) {
    throw new Error("CKAN API returned success=false");
  }

  console.log(`CKAN returned ${json.result.records.length} / ${json.result.total} records.`);
  return json.result.records;
}

/** Fallback: direct MSSS CSV (may 403 from cloud IPs). */
async function fetchCsv(): Promise<string> {
  console.log(`Falling back to MSSS CSV from ${MSSS_CSV_URL} …`);
  const response = await fetch(MSSS_CSV_URL, {
    headers: {
      "User-Agent": "quebec-urgences-bot/1.0 (github.com/brunokinder/quebec-urgences)",
      "Referer": "https://msss.gouv.qc.ca/professionnels/statistiques/documents/urgences/",
      "Accept": "text/csv,text/plain,*/*",
      "Accept-Language": "fr-CA,fr;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`MSSS HTTP ${response.status} — ${response.statusText}`);
  }

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

function parseCkanRecords(records: CkanRecord[]): ParsedRow[] {
  return records
    .map((row) => {
      const nbCivieres = toInt(String(row["Nombre_de_civieres_fonctionnelles"] ?? ""));
      const nbOccupees = toInt(String(row["Nombre_de_civieres_occupees"] ?? ""));
      const taux =
        nbCivieres && nbCivieres > 0 && nbOccupees !== null
          ? Math.round((nbOccupees / nbCivieres) * 10000) / 100
          : null;

      return {
        timestamp: parseTimestamp(String(row["Mise_a_jour"] ?? "")),
        nom_installation: String(row["Nom_installation"] ?? ""),
        region: String(row["Region"] ?? ""),
        nb_civieres: nbCivieres,
        nb_patients_civieres: nbOccupees,
        taux_occupation: taux,
        nb_patients_civieres_24h: toInt(String(row["Nombre_de_patients_sur_civiere_plus_de_24_heures"] ?? "")),
        nb_patients_civieres_48h: toInt(String(row["Nombre_de_patients_sur_civiere_plus_de_48_heures"] ?? "")),
        nb_personnes_presentes: toInt(String(row["Nombre_total_de_patients_presents_a_lurgence"] ?? "")),
        nb_pec: toInt(String(row["Nombre_total_de_patients_en_attente_de_PEC"] ?? "")),
        dms_ambulatoire: toNum(String(row["DMS_ambulatoire"] ?? "")),
        dms_civieres: toNum(String(row["DMS_sur_civiere"] ?? "")),
      };
    })
    .filter((r) => r.nom_installation && r.nom_installation !== "Total régional" && r.timestamp);
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

  let rows: ParsedRow[];
  let rawCsv: string | null = null;
  let source: string;

  // Primary: CKAN API (public open data, no rate limits)
  try {
    const records = await fetchCkan();
    rows = parseCkanRecords(records);
    source = "CKAN";
    console.log(`Parsed ${rows.length} rows from CKAN API.`);
  } catch (ckanErr) {
    const ckanMsg = ckanErr instanceof Error ? ckanErr.message : String(ckanErr);
    console.warn(`CKAN failed (${ckanMsg}), trying MSSS CSV fallback…`);

    // Fallback: direct CSV from MSSS
    try {
      rawCsv = await fetchCsv();
      rows = parseCsv(rawCsv);
      source = "MSSS CSV";
      console.log(`Parsed ${rows.length} rows from MSSS CSV.`);
    } catch (csvErr) {
      const message = csvErr instanceof Error ? csvErr.message : String(csvErr);
      console.error("Both sources failed. CSV error:", message);
      await logResult({ fetched_at: fetchedAt.toISOString(), row_count: 0, inserted: 0, skipped: 0, errors: 1, success: false, message: `CKAN: ${ckanMsg} | CSV: ${message}` });
      process.exit(1);
    }
  }

  // Archive raw CSV (best-effort — only when we have CSV data)
  if (rawCsv) {
    try {
      archiveCsv(rawCsv, fetchedAt);
    } catch (err) {
      console.warn("Archive failed (non-fatal):", err instanceof Error ? err.message : err);
    }
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

  console.log(`\nDone [${source}]. inserted=${inserted} skipped=${skipped} errors=${errors}\n`);

  if (errors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
