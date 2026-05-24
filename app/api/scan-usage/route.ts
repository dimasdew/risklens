import { NextResponse } from "next/server";
import { isSupabaseConfigured, getSupabaseServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const freeScanLimit = 50;

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ used: 0, limit: freeScanLimit });
  }

  // Check if user is authenticated — use user:${id} as identifier (same as /api/scan)
  const userId = await extractUserId(request);
  const rawId = userId ? `user:${userId}` : getClientIdentifier(request);
  const identifierHash = createHash("sha256").update(rawId).digest("hex");
  const usageDate = new Date().toISOString().split("T")[0];
  const id = `${usageDate}:${identifierHash}`;

  const client = getSupabaseServerClient();
  const { data } = await client.from("scan_usage").select("scan_count").eq("id", id).maybeSingle();

  return NextResponse.json({
    used: Number(data?.scan_count ?? 0),
    limit: freeScanLimit
  });
}

// Must match getClientIdentifier in /api/scan/route.ts exactly
function getClientIdentifier(request: Request): string {
  const deviceId = request.headers.get("x-risklens-device-id")?.trim();
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown-ip";

  if (deviceId && /^[a-f0-9-]{32,40}$/i.test(deviceId)) {
    return `device:${deviceId}:ip:${ipAddress}`;
  }

  return `ip:${ipAddress}`;
}

async function extractUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data } = await client.auth.getUser(authHeader.slice(7));
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
