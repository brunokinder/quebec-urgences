interface Props {
  lastIngestion: { fetched_at: string; inserted: number } | null;
}

export function StatusBadge({ lastIngestion }: Props) {
  if (!lastIngestion) {
    return (
      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
        Aucune ingestion
      </span>
    );
  }

  const ageMs = Date.now() - new Date(lastIngestion.fetched_at).getTime();
  const ageMinutes = Math.round(ageMs / 60_000);
  const stale = ageMinutes > 90;

  const formatted = new Date(lastIngestion.fetched_at).toLocaleString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="text-right">
      <span
        className={`text-xs px-2 py-1 rounded-full ${
          stale
            ? "bg-amber-100 text-amber-700"
            : "bg-green-100 text-green-700"
        }`}
      >
        {stale ? "Données périmées" : "Données récentes"}
      </span>
      <p className="text-xs text-gray-400 mt-0.5">Dernière màj : {formatted}</p>
    </div>
  );
}
