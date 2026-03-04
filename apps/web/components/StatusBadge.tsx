interface Props {
  lastIngestion: { fetched_at: string; inserted: number } | null;
}

export function StatusBadge({ lastIngestion }: Props) {
  if (!lastIngestion) {
    return (
      <span className="text-xs text-slate-500 bg-surface-subtle px-2 py-1 rounded-full border border-surface-border">
        Aucune ingestion
      </span>
    );
  }

  const ageMs = Date.now() - new Date(lastIngestion.fetched_at).getTime();
  const ageMinutes = Math.round(ageMs / 60_000);
  const stale = ageMinutes > 90;

  const formatted = new Date(lastIngestion.fetched_at).toLocaleString("fr-CA", {
    timeZone: "America/Toronto",
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="text-right">
      <span
        className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
          stale
            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
        }`}
      >
        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle ${stale ? "bg-amber-400" : "bg-emerald-400"}`} />
        {stale ? "Données périmées" : "Données récentes"}
      </span>
      <p className="text-xs text-slate-600 mt-1">Dernière màj : {formatted}</p>
    </div>
  );
}
