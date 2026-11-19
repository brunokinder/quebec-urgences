# Quebec Urgences

*Français | [English](README.md)*

[![Licence MIT](https://img.shields.io/badge/licence-MIT-blue.svg)](LICENSE)
[![Données : CC-BY 4.0](https://img.shields.io/badge/données-CC--BY%204.0-green.svg)](https://creativecommons.org/licenses/by/4.0/deed.fr)
[![IC](https://github.com/brunokinder/quebec-urgences/actions/workflows/ci.yml/badge.svg)](https://github.com/brunokinder/quebec-urgences/actions/workflows/ci.yml)

Tableau de bord open source affichant le **taux d'occupation** des urgences du Québec, **mis à jour chaque heure**, avec historique et analyse de tendances.

**En ligne :** [quebec-urgences.vercel.app](https://quebec-urgences.vercel.app/)

> Données : MSSS / Console provinciale des urgences (CPU) — Licence **CC-BY 4.0**

---

## Fonctionnalités

- Taux d'occupation de ~200 installations, mis à jour chaque heure
- Vue régionale avec indicateurs de surcharge
- Détail par hôpital avec graphique de tendance sur 7 jours
- Flèches de tendance : chaque urgence se remplit-elle ou se vide-t-elle par rapport à il y a 3 heures?
- Comparaison avec l'achalandage habituel et carte de chaleur jour × heure (médiane des 8 dernières semaines), avec les heures habituellement les plus calmes
- Filtre par région et recherche par nom
- Historique horaire complet conservé dans Supabase
- Endpoint `/api/status` pour surveiller la santé du pipeline

---

## Stack

| Couche          | Outil                  |
|-----------------|------------------------|
| Monorepo        | Turborepo              |
| Frontend        | Next.js 15 (App Router)|
| Styles          | Tailwind CSS           |
| Base de données | Supabase (Postgres)    |
| Ingestion       | GitHub Actions (cron)  |
| Langage         | TypeScript             |

---

## Démarrage

### Prérequis

- Node.js ≥ 20
- pnpm ≥ 9

### 1. Cloner le dépôt

```bash
git clone https://github.com/brunokinder/quebec-urgences.git
cd quebec-urgences
pnpm install
```

### 2. Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Dans l'éditeur SQL, exécuter les migrations dans l'ordre :
   - `supabase/migrations/001_create_snapshots.sql`
   - `supabase/migrations/002_rollup_function.sql`
   - `supabase/migrations/003_ingest_cron.sql` *(optionnel — ingestion horaire via pg_cron, voir [Pipeline d'ingestion](#pipeline-dingestion))*
   - `supabase/migrations/004_row_level_security.sql` *(requis — rend la clé publique anon en lecture seule)*
   - `supabase/migrations/005_trends_and_profiles.sql` *(flèches de tendance et carte de chaleur; le tableau de bord fonctionne sans, moins ces fonctionnalités)*
3. Copier `.env.example` en `.env.local` et remplir les variables :

```bash
cp .env.example .env.local
```

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...        # Settings > API > clé « secret » (anciennement service_role)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Settings > API > clé « publishable » (anciennement anon)
```

### 3. Lancer une première ingestion

```bash
pnpm ingest
```

### 4. Démarrer le tableau de bord

```bash
pnpm dev
# → http://localhost:3000
```

---

## Pipeline d'ingestion

```
API CKAN Données Québec (principale) / CSV MSSS (secours) — mis à jour toutes les heures
        │
        ├── pg_cron dans Supabase (5 * * * *) → Edge Function ingest-urgences
        │      • Récupération, analyse, validation
        │      • Upsert dans Supabase (ON CONFLICT DO NOTHING)
        │
        └── GitHub Actions (5 * * * *) — jusqu'à la mise en service de pg_cron
               • Même récupération + upsert, via scripts/ingest.ts
               • Exécutions planifiées ignorées si INGEST_VIA_PG_CRON=true
        │
Supabase — urgences_snapshots
        │
Tableau de bord Next.js (Vercel)
```

Les deux chemins partagent le même code d'ingestion : `supabase/functions/_shared/urgences.ts`
(utilisé par l'Edge Function sous Deno et par `scripts/ingest.ts` sous Node).

**Choisir qui écrit dans la base.** L'horaire de GitHub peut dériver de
plusieurs heures en période de charge; pg_cron est donc l'écrivain privilégié. Pour basculer :

1. Déployer la fonction : `supabase functions deploy ingest-urgences`
2. Exécuter `supabase/migrations/003_ingest_cron.sql` (suivre les prérequis en en-tête)
3. Dans GitHub → Settings → Secrets and variables → Actions → **Variables**, définir
   `INGEST_VIA_PG_CRON` = `true`

Les exécutions planifiées de GitHub Actions sont alors ignorées, ce qui évite la
double ingestion. Le workflow peut toujours être lancé manuellement en secours.

### Secrets GitHub requis

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | URL de votre projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (Settings > API) |

### Variables GitHub optionnelles

| Variable | Description |
|----------|-------------|
| `INGEST_VIA_PG_CRON` | `true` une fois l'ingestion pg_cron en service; les ingestions planifiées de GitHub Actions sont alors ignorées |

---

## Schéma de la base de données

### `urgences_snapshots`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | Clé primaire |
| `timestamp` | timestamptz | Heure du relevé |
| `nom_installation` | text | Nom de l'établissement |
| `region` | text | Région sociosanitaire |
| `nb_civieres` | int | Civières fonctionnelles |
| `nb_patients_civieres` | int | Patients sur civières |
| `taux_occupation` | numeric | Taux d'occupation (%) |
| `nb_patients_civieres_24h` | int | Patients sur civières > 24h |
| `nb_patients_civieres_48h` | int | Patients sur civières > 48h |
| `nb_personnes_presentes` | int | Personnes présentes |
| `nb_pec` | int | En cours d'évaluation |
| `dms_ambulatoire` | numeric | Durée moy. séjour ambulatoire (h) |
| `dms_civieres` | numeric | Durée moy. séjour civières (h) |

### Stratégie de rétention

- Données **horaires** conservées pour les **60 derniers jours**
- Données plus anciennes **agrégées en moyennes journalières** (`urgences_daily_rollups`)
- Le rollup est disponible comme workflow GitHub Actions manuel (son horaire hebdomadaire est désactivé pour l'instant, l'historique horaire est donc conservé)
- Supabase est le seul lieu de stockage des données — rien n'est versionné dans le dépôt Git

---

## Déploiement

### Vercel (recommandé)

1. Aller sur [vercel.com/new](https://vercel.com/new) et importer `brunokinder/quebec-urgences`
2. Définir le **Dossier racine** à `apps/web`
3. Ajouter les variables d'environnement suivantes :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Cliquer sur **Déployer**

Vercel détecte automatiquement Next.js et gère les builds. Les futurs push vers `main` se déploient automatiquement.

---

## Contribuer

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour les détails.

En résumé :

1. Forker le dépôt
2. Créer une branche (`git checkout -b feat/ma-fonctionnalite`)
3. Committer vos changements
4. Ouvrir une Pull Request ciblant `main`

Les rapports de bugs et demandes de fonctionnalités via [GitHub Issues](https://github.com/brunokinder/quebec-urgences/issues) sont également appréciés.

---

## Source des données

- **Fournisseur :** Ministère de la Santé et des Services sociaux (MSSS)
- **Données Québec :** [Performance du réseau hospitalier](https://www.donneesquebec.ca/recherche/dataset/performance-du-reseau-hospitalier)
- **Licence :** [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fr)
- **Fréquence :** Mise à jour horaire

---

## Licence

[MIT](LICENSE) — © 2024–2026 brunokinder
