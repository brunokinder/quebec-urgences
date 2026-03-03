# Quebec Urgences

*Français | [English](README.md)*

Tableau de bord open source affichant le **taux d'occupation en temps réel** des urgences du Québec, avec historique horaire et analyse de tendances.

> Données : MSSS / Console provinciale des urgences (CPU) — Licence **CC-BY 4.0**

---

## Fonctionnalités

- Taux d'occupation de ~200 installations, mis à jour chaque heure
- Vue régionale avec indicateurs de surcharge
- Détail par hôpital avec graphique de tendance sur 7 jours
- Filtre par région et recherche par nom
- Archive CSV publique dans `/data/` (historique permanent)
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
3. Copier `.env.example` en `.env.local` et remplir les variables :

```bash
cp .env.example .env.local
```

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...        # Settings > API > service_role
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Settings > API > anon
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
CSV MSSS (mis à jour toutes les heures)
        │
GitHub Actions (cron : 5 * * * *)
        │  • Récupération du CSV
        │  • Analyse + validation
        │  • Upsert dans Supabase (ON CONFLICT DO NOTHING)
        │  • Archive CSV → /data/{année}/{mois}/{jour}T{heure}00Z.csv
        │
Supabase — urgences_snapshots
        │
Tableau de bord Next.js (Vercel)
```

### Secrets GitHub requis

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | URL de votre projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (Settings > API) |

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
- Le rollup s'exécute chaque dimanche via GitHub Actions
- Archive CSV permanente dans `/data/` (dépôt Git)

---

## Déploiement

### Vercel (recommandé)

1. Importer le dépôt dans Vercel
2. Définir `apps/web` comme dossier racine (ou utiliser le preset Turborepo)
3. Ajouter les variables d'environnement `NEXT_PUBLIC_SUPABASE_*`
4. Déployer

---

## Contribuer

Les contributions sont les bienvenues !

1. Forker le dépôt
2. Créer une branche (`git checkout -b feat/ma-fonctionnalite`)
3. Committer vos changements
4. Ouvrir une Pull Request

---

## Source des données

- **Fournisseur :** Ministère de la Santé et des Services sociaux (MSSS)
- **Données Québec :** [b256f87f...](https://www.donneesquebec.ca/recherche/dataset/performance-du-reseau-hospitalier)
- **Licence :** [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fr)
- **Fréquence :** Mise à jour horaire

---

## Licence

[MIT](LICENSE) — © 2024 brunokinder
