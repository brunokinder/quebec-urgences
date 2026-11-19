# Contributing to Quebec Urgences

Thank you for your interest in contributing! Here's everything you need to get started.

---

## Ways to Contribute

- **Bug reports** — open a [GitHub Issue](https://github.com/brunokinder/quebec-urgences/issues) with steps to reproduce
- **Feature requests** — open an issue describing the use case
- **Code contributions** — see the workflow below
- **Hospital coordinates** — missing GPS coordinates live in `apps/web/lib/hospitalCoordinates.ts`
- **Translations / copy fixes** — both `README.md` (English) and `README.fr.md` (French) welcome corrections

---

## Development Setup

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9

### Install

```bash
git clone https://github.com/brunokinder/quebec-urgences.git
cd quebec-urgences
pnpm install
```

### Environment

```bash
cp .env.example .env.local
# Fill in your Supabase credentials
```

Run the migrations in Supabase's SQL editor:

```
supabase/migrations/001_create_snapshots.sql
supabase/migrations/002_rollup_function.sql
supabase/migrations/004_row_level_security.sql
supabase/migrations/005_trends_and_profiles.sql
```

(`003_ingest_cron.sql` is only needed if you deploy the pg_cron ingestion; see the README.)

Ingestion logic (fetch, parse, upsert) lives in `supabase/functions/_shared/urgences.ts`
and is shared by `scripts/ingest.ts` and the `ingest-urgences` Edge Function — change it there.
Keep that file import-free so it runs under both Node and Deno.

### Run locally

```bash
pnpm ingest   # seed the database with current MSSS data
pnpm dev      # start Next.js at http://localhost:3000
```

### Type-check & build

```bash
pnpm type-check
pnpm build
```

---

## Pull Request Workflow

1. Fork the repo and create a branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Make your changes.
3. Ensure `pnpm type-check` passes.
4. Open a Pull Request targeting `main` with a clear description of what and why.

Keep PRs focused — one feature or fix per PR makes review faster.

---

## Project Structure

```
apps/web/          Next.js dashboard (frontend)
packages/shared/   Shared TypeScript types & constants
scripts/           Ingestion & rollup scripts (run by GitHub Actions)
supabase/          Database migrations
data/              Legacy CSV snapshots (March 2026, no longer updated — data lives in Supabase)
```

---

## Code Style

- TypeScript strict mode throughout
- No linter is enforced yet — match the style of surrounding code
- Prefer small, focused commits with descriptive messages

---

## Data & Licensing

- Source data is published by MSSS under **CC-BY 4.0** — attribution is required
- Code contributions are covered by the project's **MIT** license
- Do not commit real credentials or personal data

---

## Questions?

Open a [GitHub Issue](https://github.com/brunokinder/quebec-urgences/issues) — happy to help.
