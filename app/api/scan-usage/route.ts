import { NextResponse } from "next/server";
import { isSupabaseConfigured, getSupabaseServerClient } from "@/lib/supabase-server";
import { createHash } from "crypto";

const freeScanLimit = 50;

export async function GET(request: Request) {
  const deviceId = request.headers.get("x-risklens-device-id");
  if (!deviceId) {
    return NextResponse.json({ used: 0, limit: freeScanLimit });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ used: 0, limit: freeScanLimit });
  }

  const identifierHash = createHash("sha256").update(deviceId).digest("hex");
  const usageDate = new Date().toISOString().split("T")[0];
  const id = `${usageDate}:${identifierHash}`;

  const client = getSupabaseServerClient();
  const { data } = await client.from("scan_usage").select("scan_count").eq("id", id).maybeSingle();

  return NextResponse.json({
    used: Number(data?.scan_count ?? 0),
    limit: freeScanLimit
  });
}
