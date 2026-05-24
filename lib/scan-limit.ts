import { createHash } from "node:crypto";
import { getSupabaseServerClient, isSupabaseConfigured } from "./supabase-server";
import { getUserTier } from "./user-tier";

const defaultScanLimit = 50;
const localUsage = new Map<string, number>();

export type ScanLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  tier: string;
};

export async function checkAndIncrementScanLimit(identifier: string, userId?: string): Promise<ScanLimitResult> {
  const usageDate = new Date().toISOString().slice(0, 10);
  const rawId = userId ? `user:${userId}` : identifier;
  const identifierHash = createHash("sha256").update(rawId).digest("hex");
  const tierInfo = await getUserTier(userId);
  const scanLimit = tierInfo.scanLimit;

  // Pro and admin get unlimited scans (no DB check needed)
  if (tierInfo.tier === "pro" || tierInfo.tier === "admin") {
    return { allowed: true, remaining: scanLimit, limit: scanLimit, tier: tierInfo.tier };
  }

  if (isSupabaseConfigured()) {
    try {
      return await checkSupabaseLimit(identifierHash, usageDate, scanLimit, tierInfo.tier);
    } catch (error) {
      console.error("Supabase scan limit failed, falling back to local limit:", error);
    }
  }

  return checkLocalLimit(identifierHash, usageDate, scanLimit, tierInfo.tier);
}

function checkLocalLimit(identifierHash: string, usageDate: string, scanLimit: number, tier: string): ScanLimitResult {
  const key = `${usageDate}:${identifierHash}`;
  const current = localUsage.get(key) ?? 0;

  if (current >= scanLimit) {
    return { allowed: false, remaining: 0, limit: scanLimit, tier };
  }

  const next = current + 1;
  localUsage.set(key, next);
  return { allowed: true, remaining: Math.max(0, scanLimit - next), limit: scanLimit, tier };
}

async function checkSupabaseLimit(identifierHash: string, usageDate: string, scanLimit: number, tier: string): Promise<ScanLimitResult> {
  const client = getSupabaseServerClient();
  const id = `${usageDate}:${identifierHash}`;

  const { data, error } = await client.rpc("increment_scan_usage", {
    p_id: id,
    p_identifier_hash: identifierHash,
    p_usage_date: usageDate,
    p_limit: scanLimit
  });

  if (error) {
    if (error.code === "42883") {
      return await checkSupabaseLimitFallback(identifierHash, usageDate, scanLimit, tier);
    }
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  const allowed = Boolean(row?.allowed);
  const count = Number(row?.scan_count ?? 0);

  return {
    allowed,
    remaining: allowed ? Math.max(0, scanLimit - count) : 0,
    limit: scanLimit,
    tier
  };
}

async function checkSupabaseLimitFallback(identifierHash: string, usageDate: string, scanLimit: number, tier: string): Promise<ScanLimitResult> {
  const client = getSupabaseServerClient();
  const id = `${usageDate}:${identifierHash}`;
  const { data } = await client.from("scan_usage").select("scan_count").eq("id", id).maybeSingle();
  const current = Number(data?.scan_count ?? 0);

  if (current >= scanLimit) {
    return { allowed: false, remaining: 0, limit: scanLimit, tier };
  }

  const next = current + 1;
  const { error } = await client.from("scan_usage").upsert({
    id,
    identifier_hash: identifierHash,
    usage_date: usageDate,
    scan_count: next,
    updated_at: new Date().toISOString()
  });

  if (error) throw error;

  return { allowed: true, remaining: Math.max(0, scanLimit - next), limit: scanLimit, tier };
}

