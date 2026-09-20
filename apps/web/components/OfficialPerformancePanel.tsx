const OFFICIAL_DASHBOARD_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiOGIyZWI4NGQtN2FjZC00OGFjLTgwMWYtZmM3N2M3ZjYyNjU2IiwidCI6IjA2ZTFmZTI4LTVmOGItNDA3NS1iZjZjLWFlMjRiZTFhNzk5MiJ9";

const indicators = [
  {
    title: "Priorités 1 à 3",
    description: "Délai moyen entre le triage et la première prise en charge par un médecin ou un professionnel.",
    tone: "text-red-300 border-red-500/20 bg-red-500/5",
  },
  {
    title: "Priorités 4 et 5",
    description: "Délai moyen après le triage pour les situations moins urgentes.",
    tone: "text-amber-300 border-amber-500/20 bg-amber-500/5",
  },
  {
    title: "Avant un lit à l'étage",
    description: "Durée moyenne passée à l'urgence avant l'obtention d'un lit d'hospitalisation.",
    tone: "text-blue-300 border-blue-500/20 bg-blue-500/5",
  },
];

/** Contextual indicators published separately by Santé Québec (daily/weekly, not live). */
export function OfficialPerformancePanel() {
  return (
    <section className="rounded-xl border border-surface-border bg-surface-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Délais officiels après le triage
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Publiés séparément par Santé Québec, avec un décalage d&apos;au moins une journée.
          </p>
        </div>
        <a
          href={OFFICIAL_DASHBOARD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg border border-surface-border bg-surface-subtle px-3 py-2 text-xs font-medium text-blue-400 transition-colors hover:bg-surface-hover hover:text-blue-300"
        >
          Voir les valeurs officielles ↗
        </a>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {indicators.map((indicator) => (
          <div key={indicator.title} className={`rounded-lg border p-4 ${indicator.tone}`}>
            <p className="text-sm font-semibold">{indicator.title}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{indicator.description}</p>
          </div>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        Ces moyennes dépendent de la priorité de triage; elles ne prédisent pas l&apos;attente d&apos;une personne donnée.
      </p>
    </section>
  );
}
