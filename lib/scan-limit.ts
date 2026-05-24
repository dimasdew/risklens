import { createHash } from "node:crypto";
import { getSupabaseServerClient, isSupabaseConfigured } from "./supabase-server";

const freeScanLimit = 50;
const localUsage = new Map<string, number>();

export type ScanLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
};

export async function checkAndIncrementScanLimit(identifier: string, userId?: string): Promise<ScanLimitResult> {
  const usageDate = new Date().toISOString().slice(0, 10);
  const rawId = userId ? `user:${userId}` : identifier;
  const identifierHash = createHash("sha256").update(rawId).digest("hex");

  if (isSupabaseConfigured()) {
    try {
      return await checkSupabaseLimit(identifierHash, usageDate);
    } catch (error) {
      console.error("Supabase scan limit failed, falling back to local limit:", error);
    }
  }

  return checkLocalLimit(identifierHash, usageDate);
}

function checkLocalLimit(identifierHash: string, usageDate: string): ScanLimitResult {
  const key = `${usageDate}:${identifierHash}`;
  const current = localUsage.get(key) ?? 0;

  if (current >= freeScanLimit) {
    return { allowed: false, remaining: 0, limit: freeScanLimit };
  }

  const next = current + 1;
  localUsage.set(key, next);
  return { allowed: true, remaining: Math.max(0, freeScanLimit - next), limit: freeScanLimit };
}

async function checkSupabaseLimit(identifierHash: string, usageDate: string): Promise<ScanLimitResult> {
  const client = getSupabaseServerClient();
  const id = `${usageDate}:${identifierHash}`;
  const { data } = await client.from("scan_usage").select("scan_count").eq("id", id).maybeSingle();
  const current = Number(data?.scan_count ?? 0);

  if (current >= freeScanLimit) {
    return { allowed: false, remaining: 0, limit: freeScanLimit };
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

  return { allowed: true, remaining: Math.max(0, freeScanLimit - next), limit: freeScanLimit };
}

