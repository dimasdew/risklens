import { NextResponse } from "next/server";
import { fetchScanData } from "@/lib/data-sources";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { saveReport } from "@/lib/report-store";
import { buildRiskReport } from "@/lib/risk-engine";
import { checkAndIncrementScanLimit } from "@/lib/scan-limit";
import type { Chain } from "@/lib/types";
import { createClient } from "@supabase/supabase-js";

const maxAddressLength = 64;

const chains = new Set<Chain>(["solana", "base", "bsc", "ethereum"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { chain?: Chain; address?: string };
    const chain = body.chain;
    const address = body.address?.trim();

    if (!chain || !chains.has(chain)) {
      return NextResponse.json({ error: "Unsupported chain." }, { status: 400 });
    }

    if (!address || address.length > maxAddressLength || !isValidAddress(chain, address)) {
      return NextResponse.json({ error: "Invalid token address for selected chain." }, { status: 400 });
    }

    const clientIp = getClientIp(request);
    const burst = checkRateLimit(clientIp, "scan");
    if (!burst.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429, headers: getRateLimitHeaders(burst) }
      );
    }

    const userId = await extractUserId(request);
    const limit = await checkAndIncrementScanLimit(getClientIdentifier(request), userId ?? undefined);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Free scan limit reached. You can run ${limit.limit} scans per day on the free plan.` },
        { status: 429, headers: { "x-scan-limit": String(limit.limit), "x-scan-remaining": "0" } }
      );
    }

    const data = await fetchScanData(chain, address);
    const report = await saveReport(buildRiskReport(data), userId ?? undefined);
    return NextResponse.json(report, {
      headers: { "x-scan-limit": String(limit.limit), "x-scan-remaining": String(limit.remaining) }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scan failed." },
      { status: 500 }
    );
  }
}

function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown-ip";
}

function getClientIdentifier(request: Request) {
  const deviceId = request.headers.get("x-risklens-device-id")?.trim();
  const ipAddress = getClientIp(request);

  if (deviceId && /^[a-f0-9-]{32,40}$/i.test(deviceId)) {
    return `device:${deviceId}:ip:${ipAddress}`;
  }

  return `ip:${ipAddress}`;
}

async function extractUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data } = await client.auth.getUser(token);
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

function isValidAddress(chain: Chain, address: string) {
  if (chain === "solana") {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }

  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
