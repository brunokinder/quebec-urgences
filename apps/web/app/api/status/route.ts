import { NextResponse } from "next/server";
import { getLastIngestion } from "@/lib/queries";

export const revalidate = 60;

export async function GET() {
  const last = await getLastIngestion();

  if (!last) {
    return NextResponse.json({ status: "unknown", message: "No ingestion data found." }, { status: 503 });
  }

  const ageMs = Date.now() - new Date(last.fetched_at).getTime();
  const ageMinutes = Math.round(ageMs / 60_000);
  const healthy = ageMinutes < 90; // Warn if data is >90 min old

  return NextResponse.json({
    status: healthy ? "ok" : "stale",
    last_ingestion: last.fetched_at,
    age_minutes: ageMinutes,
    last_inserted: last.inserted,
  });
}
