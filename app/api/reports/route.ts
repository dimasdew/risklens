import { NextResponse } from "next/server";
import { listReports } from "@/lib/report-store";

export async function GET() {
  const reports = await listReports(12);
  return NextResponse.json({ reports });
}
