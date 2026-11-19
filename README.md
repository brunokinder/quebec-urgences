# Quebec Urgences

*[Français](README.fr.md) | English*

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Data License: CC-BY 4.0](https://img.shields.io/badge/data-CC--BY%204.0-green.svg)](https://creativecommons.org/licenses/by/4.0/)
[![CI](https://github.com/brunokinder/quebec-urgences/actions/workflows/ci.yml/badge.svg)](https://github.com/brunokinder/quebec-urgences/actions/workflows/ci.yml)

Open source dashboard displaying the **occupancy rates** of Quebec emergency rooms, **updated every hour**, with historical data and trend analysis.

**Live:** [quebec-urgences.vercel.app](https://quebec-urgences.vercel.app/)

> Data: MSSS / Console provinciale des urgences (CPU) — License **CC-BY 4.0**

---

## Features

- Occupancy rates for ~200 hospitals, updated every hour
- Regional overview with overcrowding indicators
- Hospital detail page with 7-day hourly trend chart
- Trend arrows: is each ER filling up or emptying compared with 3 hours ago?
- "Usual level" comparison and weekday × hour heat map (median of the last 8 weeks), with the usually calmest hours of the day
- Filter by region and search by name
- Full hourly history stored in Supabase
- `/api/status` endpoint for pipeline health monitoring

---

## Stack

| Layer         | Tool                   |
|---------------|------------------------|
| Monorepo      | Turborepo              |
| Frontend      | Next.js 15 (App Router)|
| Styling       | Tailwind CSS           |
| Database      | Supabase (Postgres)    |
| Ingestion     | GitHub Actions (cron)  |
| Language      | TypeScript             |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9

### 1. Clone the repo

```bash
git clone https://github.com/brunokinder/quebec-urgences.git
cd quebec-urgences
pnpm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. In the SQL editor, run the migrations in order:
   - `supabase/migrations/001_create_snapshots.sql`
   - `supabase/migrations/002_rollup_function.sql`
   - `supabase/migrations/003_ingest_cron.sql` *(optional — hourly ingestion via pg_cron, see [Ingestion Pipeline](#ingestion-pipeline))*
   - `supabase/migrations/004_row_level_security.sql` *(required — makes the public anon key read-only)*
   - `supabase/migrations/005_trends_and_profiles.sql` *(trend arrows and usual-level heat map; the dashboard works without it, minus those features)*
3. Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...        # Settings > API > "secret" key (formerly service_role)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Settings > API > "publishable" key (formerly anon)
```

### 3. Run your first ingestion

```bash
pnpm ingest
```

### 4. Start the dashboard

```bash
pnpm dev
# → http://localhost:3000
```

---

## Ingestion Pipeline

```
Données Québec CKAN API (primary) / MSSS CSV (fallback) — updated hourly
        │
        ├── pg_cron in Supabase (5 * * * *) → Edge Function ingest-urgences
        │      • Fetch, parse, validate
        │      • Upsert into Supabase (ON CONFLICT DO NOTHING)
        │
        └── GitHub Actions (5 * * * *) — until pg_cron is live
               • Same fetch + upsert, via scripts/ingest.ts
               • Scheduled runs skipped when INGEST_VIA_PG_CRON=true
        │
Supabase — urgences_snapshots
        │
Next.js Dashboard (Vercel)
```

Both paths share one ingestion core: `supabase/functions/_shared/urgences.ts`
(used by the Edge Function under Deno and by `scripts/ingest.ts` under Node).

**Choosing who writes to the database.** GitHub's scheduler can drift by
hours under load, so pg_cron is the preferred writer. To switch:

1. Deploy the function: `supabase functions deploy ingest-urgences`
2. Run `supabase/migrations/003_ingest_cron.sql` (follow the prerequisites in its header)
3. In GitHub → Settings → Secrets and variables → Actions → **Variables**, set
   `INGEST_VIA_PG_CRON` = `true`

From then on scheduled GitHub Actions runs are skipped, so data isn't ingested
twice. You can still run the workflow manually as a backup.

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (Settings > API) |

### Optional GitHub Variables

| Variable | Description |
|----------|-------------|
| `INGEST_VIA_PG_CRON` | `true` once pg_cron ingestion is live; scheduled GitHub Actions ingests are then skipped |

---

## Database Schema

### `urgences_snapshots`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `timestamp` | timestamptz | Snapshot time |
| `nom_installation` | text | Hospital name |
| `region` | text | Health region |
| `nb_civieres` | int | Available stretchers |
| `nb_patients_civieres` | int | Patients on stretchers |
| `taux_occupation` | numeric | Occupancy rate (%) |
| `nb_patients_civieres_24h` | int | Patients on stretchers > 24h |
| `nb_patients_civieres_48h` | int | Patients on stretchers > 48h |
| `nb_personnes_presentes` | int | Total people present |
| `nb_pec` | int | Currently being assessed |
| `dms_ambulatoire` | numeric | Avg ambulatory stay (h) |
| `dms_civieres` | numeric | Avg stretcher stay (h) |

### Retention Strategy

- **Hourly** data kept for the **last 60 days**
- Older data is **aggregated into daily averages** (`urgences_daily_rollups`)
- Rollup is available as a manual GitHub Actions workflow (its weekly schedule is currently disabled, so hourly history is kept)
- Supabase is the only data store — nothing is committed to the Git repository

---

## Deployment

### Vercel (recommended)

1. Go to [vercel.com/new](https://vercel.com/new) and import `brunokinder/quebec-urgences` (or your fork)
2. Set **Root Directory** to `apps/web`
3. Add the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**

Vercel auto-detects Next.js and handles builds. Future pushes to `main` deploy automatically.

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

Quick summary:

1. Fork the repository
2. Create a branch (`git checkout -b feat/my-feature`)
3. Commit your changes
4. Open a Pull Request targeting `main`

Bug reports and feature requests via [GitHub Issues](https://github.com/brunokinder/quebec-urgences/issues) are also appreciated.

---

## Data Source

- **Provider:** Ministère de la Santé et des Services sociaux (MSSS)
- **Données Québec:** [Performance du réseau hospitalier](https://www.donneesquebec.ca/recherche/dataset/performance-du-reseau-hospitalier)
- **License:** [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- **Frequency:** Hourly updates

---

## License

[MIT](LICENSE) — © 2024–2026 brunokinder
