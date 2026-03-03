# Quebec Urgences

*[Français](README.fr.md) | English*

Open source dashboard displaying **real-time occupancy rates** of Quebec emergency rooms, with hourly historical data and trend analysis.

> Data: MSSS / Console provinciale des urgences (CPU) — License **CC-BY 4.0**

---

## Features

- Occupancy rates for ~200 hospitals, updated every hour
- Regional overview with overcrowding indicators
- Hospital detail page with 7-day hourly trend chart
- Filter by region and search by name
- Public CSV archive in `/data/` (permanent historical record)
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
MSSS CSV (updated every hour)
        │
GitHub Actions (cron: 5 * * * *)
        │  • Fetch CSV
        │  • Parse + validate
        │  • Upsert into Supabase (ON CONFLICT DO NOTHING)
        │  • Archive CSV → /data/{year}/{month}/{day}T{hour}00Z.csv
        │
Supabase — urgences_snapshots
        │
Next.js Dashboard (Vercel)
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (Settings > API) |

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
- Rollup runs every Sunday via GitHub Actions
- Raw CSV permanently archived in `/data/` (Git repository)

---

## Deployment

### Vercel (recommended)

1. Go to [vercel.com/new](https://vercel.com/new) and import `brunokinder/quebec-urgences`
2. Set **Root Directory** to `apps/web`
3. Add the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**

Vercel auto-detects Next.js and handles builds. Future pushes to `main` deploy automatically.

---

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a branch (`git checkout -b feat/my-feature`)
3. Commit your changes
4. Open a Pull Request

---

## Data Source

- **Provider:** Ministère de la Santé et des Services sociaux (MSSS)
- **Données Québec:** [b256f87f...](https://www.donneesquebec.ca/recherche/dataset/performance-du-reseau-hospitalier)
- **License:** [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- **Frequency:** Hourly updates

---

## License

[MIT](LICENSE) — © 2024 brunokinder
