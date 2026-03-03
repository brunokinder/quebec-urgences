"use client";

import dynamic from "next/dynamic";
import type { UrgenceSnapshot } from "@quebec-urgences/shared";

const HospitalMapClient = dynamic(() => import("./HospitalMapClient"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface-card flex items-center justify-center">
      <p className="text-slate-600 text-sm animate-pulse">Chargement de la carte…</p>
    </div>
  ),
});

interface Props {
  snapshots: UrgenceSnapshot[];
}

export default function HospitalMapWrapper({ snapshots }: Props) {
  return <HospitalMapClient snapshots={snapshots} />;
}
