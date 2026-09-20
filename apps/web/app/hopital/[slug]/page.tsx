import { notFound } from "next/navigation";
import { getLatestSnapshots, getHospitalTrend } from "@/lib/queries";
import { OccupationBadge } from "@/components/OccupationBadge";
import { TrendChart } from "@/components/TrendChart";
import { formatHospitalName } from "@/lib/formatHospitalName";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function HospitalPage({ params }: Props) {
  const { slug } = await params;
  const nomInstallation = decodeURIComponent(slug);

  const [snapshots, trend] = await Promise.all([
    getLatestSnapshots(),
    getHospitalTrend(nomInstallation, 7),
  ]);

  const current = snapshots.find((s) => s.nom_installation === nomInstallation);
  if (!current) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <a
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Retour au tableau de bord
        </a>
        <h2 className="text-2xl font-bold mt-3 text-slate-50 tracking-tight leading-tight">
          {formatHospitalName(current.nom_installation)}
        </h2>
        <p className="text-slate-500 mt-1">{current.region}</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metric label="Taux d'occupation" value={<OccupationBadge rate={current.taux_occupation} size="lg" />} highlight />
        <Metric label="Patients / civières" value={`${current.nb_patients_civieres ?? "—"} / ${current.nb_civieres ?? "—"}`} />
        <Metric label="> 24h" value={current.nb_patients_civieres_24h ?? "—"} />
        <Metric label="> 48h" value={current.nb_patients_civieres_48h ?? "—"} />
        <Metric label="Présences" value={current.nb_personnes_presentes ?? "—"} />
        <Metric label="En attente de prise en charge" value={current.nb_pec ?? "—"} />
        <Metric label="Séjour moyen (ambulatoire)" value={current.dms_ambulatoire != null ? `${current.dms_ambulatoire}h` : "—"} />
        <Metric label="Séjour moyen (civières)" value={current.dms_civieres != null ? `${current.dms_civieres}h` : "—"} />
      </div>

      {/* Trend chart */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
          Taux d&apos;occupation — 7 derniers jours
        </h3>
        <TrendChart data={trend} />
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        Le nombre de personnes en attente est un portrait en direct. Le temps avant de voir un médecin
        dépend de la priorité attribuée au triage et n&apos;est pas fourni par le relevé horaire.
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-surface-card rounded-xl border p-4 ${highlight ? "border-surface-border" : "border-surface-border"}`}>
      <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium">{label}</p>
      <div className="text-lg font-semibold text-slate-100">{value}</div>
    </div>
  );
}
