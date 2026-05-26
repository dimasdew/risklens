import { NextResponse } from "next/server";
import { isSupabaseConfigured, getSupabaseServerClient } from "@/lib/supabase-server";
import { getUserTier } from "@/lib/user-tier";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const defaultScanLimit = 50;

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(ip, "api");
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: getRateLimitHeaders(rl) });
  }
  const userId = await extractUserId(request);
  const tierInfo = await getUserTier(userId);

  // Pro/admin: unlimited, no need to check usage
  if (tierInfo.tier === "pro" || tierInfo.tier === "admin") {
    return NextResponse.json({ used: 0, limit: tierInfo.scanLimit, tier: tierInfo.tier });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ used: 0, limit: defaultScanLimit, tier: "free" });
  }

  const rawId = userId ? `user:${userId}` : getClientIdentifier(request);
  const identifierHash = createHash("sha256").update(rawId).digest("hex");
  const usageDate = new Date().toISOString().split("T")[0];
  const id = `${usageDate}:${identifierHash}`;

  const client = getSupabaseServerClient();
  const { data } = await client.from("scan_usage").select("scan_count").eq("id", id).maybeSingle();

  return NextResponse.json({
    used: Number(data?.scan_count ?? 0),
    limit: tierInfo.scanLimit,
    tier: tierInfo.tier
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
