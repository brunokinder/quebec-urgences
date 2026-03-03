import { notFound } from "next/navigation";
import { getLatestSnapshots, getHospitalTrend } from "@/lib/queries";
import { OccupationBadge } from "@/components/OccupationBadge";
import { TrendChart } from "@/components/TrendChart";

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
        <a href="/" className="text-sm text-blue-600 hover:underline">← Retour</a>
        <h2 className="text-2xl font-bold mt-2">{current.nom_installation}</h2>
        <p className="text-gray-500">{current.region}</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Metric label="Taux d'occupation" value={<OccupationBadge rate={current.taux_occupation} size="lg" />} />
        <Metric label="Patients / civières" value={`${current.nb_patients_civieres ?? "—"} / ${current.nb_civieres ?? "—"}`} />
        <Metric label="> 24h" value={current.nb_patients_civieres_24h ?? "—"} />
        <Metric label="> 48h" value={current.nb_patients_civieres_48h ?? "—"} />
        <Metric label="Présences" value={current.nb_personnes_presentes ?? "—"} />
        <Metric label="En cours d'éval." value={current.nb_pec ?? "—"} />
        <Metric label="DMS ambulatoire" value={current.dms_ambulatoire != null ? `${current.dms_ambulatoire}h` : "—"} />
        <Metric label="DMS civières" value={current.dms_civieres != null ? `${current.dms_civieres}h` : "—"} />
      </div>

      {/* Trend chart */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Taux d&apos;occupation — 7 derniers jours
        </h3>
        <TrendChart data={trend} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
