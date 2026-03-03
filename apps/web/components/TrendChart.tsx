"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { UrgenceSnapshot } from "@quebec-urgences/shared";
import { CRITICAL_OCCUPATION_THRESHOLD, HIGH_OCCUPATION_THRESHOLD } from "@quebec-urgences/shared";

interface Props {
  data: UrgenceSnapshot[];
}

export function TrendChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400 italic">Aucune donnée disponible.</p>;
  }

  const chartData = data.map((s) => ({
    time: new Date(s.timestamp).toLocaleString("fr-CA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    taux: s.taux_occupation,
    patients: s.nb_patients_civieres,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            unit="%"
            domain={[0, "auto"]}
          />
          <Tooltip
            formatter={(value: number) => [`${value?.toFixed(1)}%`, "Taux d'occupation"]}
          />
          <ReferenceLine
            y={CRITICAL_OCCUPATION_THRESHOLD}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{ value: "100%", fill: "#ef4444", fontSize: 10 }}
          />
          <ReferenceLine
            y={HIGH_OCCUPATION_THRESHOLD}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            label={{ value: "80%", fill: "#f59e0b", fontSize: 10 }}
          />
          <Line
            type="monotone"
            dataKey="taux"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
