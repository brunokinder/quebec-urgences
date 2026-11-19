/**
 * supabase/functions/_shared/urgences.ts
 *
 * Runtime-agnostic ingestion core shared by:
 *   - scripts/ingest.ts                       (Node, via tsx — GitHub Actions / local)
 *   - supabase/functions/ingest-urgences      (Deno Edge Function — pg_cron)
 *
 * Keep this file free of imports: it must run unchanged under Node and Deno.
 * CSV parsing (csv-parse) and the Supabase client are injected by each caller
 * because their import specifiers differ between runtimes.
 */

// ─── Sources ─────────────────────────────────────────────────────────────────

// Use the non-www host directly to avoid a 301 redirect that can strip
// custom headers (User-Agent, Referer) in Node's fetch implementation.
export const MSSS_CSV_URL =
  "https://msss.gouv.qc.ca/professionnels/statistiques/documents/urgences/Releve_horaire_urgences_7jours_nbpers.csv";

export const CKAN_API_URL =
  "https://www.donneesquebec.ca/recherche/api/3/action/datastore_search?resource_id=b256f87f-40ec-4c79-bdba-a23e9c50e741";

// ─── Column names ────────────────────────────────────────────────────────────

// As of 2026-03 the source uses snake_case French headers (same names in the
// CKAN API and the MSSS CSV). taux_occupation is not provided — computed from
// occupied / functional stretchers. Adjust here if MSSS renames columns.
export const COL = {
  timestamp: "Mise_a_jour",
  installation: "Nom_installation",
  region: "Region",
  civieres: "Nombre_de_civieres_fonctionnelles",
  occupees: "Nombre_de_civieres_occupees",
  plus24h: "Nombre_de_patients_sur_civiere_plus_de_24_heures",
  plus48h: "Nombre_de_patients_sur_civiere_plus_de_48_heures",
  presents: "Nombre_total_de_patients_presents_a_lurgence",
  pec: "Nombre_total_de_patients_en_attente_de_PEC",
  dmsAmbulatoire: "DMS_ambulatoire",
  dmsCivieres: "DMS_sur_civiere",
} as const;

export const REQUIRED_COLUMNS = [
  COL.timestamp,
  COL.installation,
  COL.region,
  COL.civieres,
  COL.occupees,
];

/** Rows that aggregate a region rather than describe one installation. */
const EXCLUDED_INSTALLATIONS = new Set(["Total régional"]);

// ─── Types ───────────────────────────────────────────────────────────────────

export type RawRecord = Record<string, string | number | null | undefined>;

export interface ParsedRow {
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

export interface IngestLogEntry {
  fetched_at: string;
  row_count: number;
  inserted: number;
  skipped: number;
  errors: number;
  success: boolean;
  message?: string;
}

// ─── Value helpers ───────────────────────────────────────────────────────────

function str(value: RawRecord[string]): string {
  return value == null ? "" : String(value).trim();
}

export function toNum(value: RawRecord[string]): number | null {
  const s = str(value);
  if (s === "" || s === "N/D") return null;
  const n = parseFloat(s.replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

export function toInt(value: RawRecord[string]): number | null {
  const s = str(value);
  if (s === "" || s === "N/D") return null;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

// ─── Timestamps ──────────────────────────────────────────────────────────────

/** UTC offset (minutes) in effect in Quebec at a given instant. */
function quebecUtcOffsetMinutes(instant: Date): number {
  // Intl gives us e.g. "GMT-5" or "GMT-4" for the given instant
  const part = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    timeZoneName: "shortOffset",
  })
    .formatToParts(instant)
    .find((p) => p.type === "timeZoneName")?.value ?? "GMT-5";
  const match = part.match(/GMT([+-]\d+)(?::(\d+))?/);
  if (!match) return -300;
  const h = parseInt(match[1], 10);
  const m = match[2] ? parseInt(match[2], 10) : 0;
  return h * 60 + Math.sign(h || 1) * m;
}

function formatOffset(minutes: number): string {
  const sign = minutes <= 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

/**
 * UTC offset in effect in Quebec at a given Quebec wall-clock time.
 * Independent of the host's own time zone: we read the wall-clock fields
 * as if they were UTC, guess the offset, then correct once (handles DST).
 */
function quebecOffsetForWallClock(y: number, mo: number, d: number, h: number, mi: number): string {
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  const guess = quebecUtcOffsetMinutes(new Date(asUtc));
  const offset = quebecUtcOffsetMinutes(new Date(asUtc - guess * 60_000));
  return formatOffset(offset);
}

/**
 * MSSS timestamps are Quebec local time with no offset, e.g. "2026-03-03T8:45".
 * Returns a padded ISO 8601 string with the correct offset, e.g.
 * "2026-03-03T08:45:00-05:00", or "" if the value is empty.
 */
export function parseTimestamp(value: string): string {
  if (!value) return "";
  const [datePart, timePart] = value.trim().split("T");
  if (!datePart || !timePart) return value;
  const [hours, minutes] = timePart.split(":");
  const hh = (hours ?? "0").padStart(2, "0");
  const mm = (minutes ?? "00").padStart(2, "0").slice(0, 2);
  const [y, mo, d] = datePart.split("-").map(Number);
  if (!y || !mo || !d) return value;
  const offset = quebecOffsetForWallClock(y, mo, d, Number(hh), Number(mm));
  return `${datePart}T${hh}:${mm}:00${offset}`;
}

// ─── Parsing ─────────────────────────────────────────────────────────────────

/** Required columns absent from the source (empty array when all present). */
export function missingColumns(records: RawRecord[]): string[] {
  if (records.length === 0) return [...REQUIRED_COLUMNS];
  const cols = Object.keys(records[0]);
  return REQUIRED_COLUMNS.filter((c) => !cols.includes(c));
}

/** Map raw source records (CKAN or CSV — same column names) to DB rows. */
export function parseRecords(records: RawRecord[]): ParsedRow[] {
  return records
    .map((row): ParsedRow => {
      const nbCivieres = toInt(row[COL.civieres]);
      const nbOccupees = toInt(row[COL.occupees]);
      const taux =
        nbCivieres && nbCivieres > 0 && nbOccupees !== null
          ? Math.round((nbOccupees / nbCivieres) * 10000) / 100
          : null;

      return {
        timestamp: parseTimestamp(str(row[COL.timestamp])),
        nom_installation: str(row[COL.installation]),
        region: str(row[COL.region]),
        nb_civieres: nbCivieres,
        nb_patients_civieres: nbOccupees,
        taux_occupation: taux,
        nb_patients_civieres_24h: toInt(row[COL.plus24h]),
        nb_patients_civieres_48h: toInt(row[COL.plus48h]),
        nb_personnes_presentes: toInt(row[COL.presents]),
        nb_pec: toInt(row[COL.pec]),
        dms_ambulatoire: toNum(row[COL.dmsAmbulatoire]),
        dms_civieres: toNum(row[COL.dmsCivieres]),
      };
    })
    .filter((r) => r.nom_installation && !EXCLUDED_INSTALLATIONS.has(r.nom_installation) && r.timestamp);
}

// ─── Fetching ────────────────────────────────────────────────────────────────

interface CkanResponse {
  success: boolean;
  result: { records: RawRecord[]; total: number };
}

/** Primary source: Données Québec CKAN API (public, no rate limits). */
export async function fetchCkan(): Promise<RawRecord[]> {
  console.log("Fetching from CKAN API …");
  const response = await fetch(`${CKAN_API_URL}&limit=300`);
  if (!response.ok) {
    throw new Error(`CKAN HTTP ${response.status} — ${response.statusText}`);
  }
  const json = (await response.json()) as CkanResponse;
  if (!json.success) throw new Error("CKAN API returned success=false");
  console.log(`CKAN returned ${json.result.records.length} / ${json.result.total} records.`);
  if (json.result.records.length < json.result.total) {
    console.warn("WARNING: CKAN result truncated — raise the limit.");
  }
  return json.result.records;
}

/** Fallback: direct MSSS CSV (may 403 from cloud IPs). Returns decoded text. */
export async function fetchMsssCsv(): Promise<string> {
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
  return new TextDecoder("windows-1252").decode(await response.arrayBuffer());
}

export type CsvParser = (raw: string) => RawRecord[];

/** csv-parse options both callers should use for the MSSS CSV. */
export const CSV_PARSE_OPTIONS = {
  columns: true,
  skip_empty_lines: true,
  delimiter: ",",
  trim: true,
  bom: true,
} as const;

export interface FetchResult {
  source: "CKAN" | "MSSS CSV";
  records: RawRecord[];
  rows: ParsedRow[];
}

/**
 * Fetch from CKAN, falling back to the MSSS CSV. Throws with both error
 * messages if neither source works.
 */
export async function fetchSource(parseCsv: CsvParser): Promise<FetchResult> {
  let ckanMsg: string;
  try {
    const records = await fetchCkan();
    warnMissing(records);
    return { source: "CKAN", records, rows: parseRecords(records) };
  } catch (err) {
    ckanMsg = err instanceof Error ? err.message : String(err);
    console.warn(`CKAN failed (${ckanMsg}), trying MSSS CSV fallback…`);
  }
  try {
    const records = parseCsv(await fetchMsssCsv());
    if (records.length === 0) throw new Error("CSV is empty — possible format change.");
    warnMissing(records);
    return { source: "MSSS CSV", records, rows: parseRecords(records) };
  } catch (err) {
    const csvMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`CKAN: ${ckanMsg} | CSV: ${csvMsg}`);
  }
}

function warnMissing(records: RawRecord[]): void {
  const missing = missingColumns(records);
  if (missing.length > 0) {
    console.warn(`WARNING: Missing source columns: ${missing.join(", ")}`);
    console.warn(`Available columns: ${Object.keys(records[0] ?? {}).join(", ")}`);
  }
}

// ─── Database ────────────────────────────────────────────────────────────────

/**
 * Minimal structural type for the supabase-js client, so this file needs no
 * import (the Node and Deno callers import supabase-js differently).
 */
// deno-lint-ignore no-explicit-any
export type SupabaseLike = { from(table: string): any };

const BATCH_SIZE = 100;

/** Insert rows, ignoring (nom_installation, timestamp) duplicates. */
export async function upsertRows(
  supabase: SupabaseLike,
  rows: ParsedRow[]
): Promise<{ inserted: number; skipped: number; errors: number }> {
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

export async function logIngestion(supabase: SupabaseLike, entry: IngestLogEntry): Promise<void> {
  const { error } = await supabase.from("ingestion_log").insert(entry);
  if (error) console.error("Failed to write ingestion log:", error.message);
}

/** Fetch → upsert → log. Shared by both runtimes. */
export async function runIngest(
  supabase: SupabaseLike,
  parseCsv: CsvParser
): Promise<{ entry: IngestLogEntry; source?: string; records: RawRecord[] }> {
  const fetchedAt = new Date().toISOString();
  console.log(`\n=== Urgences Québec — Ingest [${fetchedAt}] ===\n`);

  let fetched: FetchResult;
  try {
    fetched = await fetchSource(parseCsv);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Both sources failed:", message);
    const entry: IngestLogEntry = {
      fetched_at: fetchedAt, row_count: 0, inserted: 0, skipped: 0, errors: 1, success: false, message,
    };
    await logIngestion(supabase, entry);
    return { entry, records: [] };
  }

  console.log(`Parsed ${fetched.rows.length} rows from ${fetched.source}.`);
  const { inserted, skipped, errors } = await upsertRows(supabase, fetched.rows);
  const entry: IngestLogEntry = {
    fetched_at: fetchedAt,
    row_count: fetched.rows.length,
    inserted,
    skipped,
    errors,
    success: errors === 0,
    message: `source=${fetched.source}`,
  };
  await logIngestion(supabase, entry);
  console.log(`\nDone [${fetched.source}]. inserted=${inserted} skipped=${skipped} errors=${errors}\n`);
  return { entry, source: fetched.source, records: fetched.records };
}
