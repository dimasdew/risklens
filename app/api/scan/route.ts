import { NextResponse } from "next/server";
import { fetchScanData } from "@/lib/data-sources";
import { checkRateLimit } from "@/lib/rate-limit";
import { saveReport } from "@/lib/report-store";
import { buildRiskReport } from "@/lib/risk-engine";
import { checkAndIncrementScanLimit } from "@/lib/scan-limit";
import type { Chain } from "@/lib/types";

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
    const burst = checkRateLimit(clientIp);
    if (!burst.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        {
          status: 429,
          headers: {
            "retry-after": String(Math.ceil((burst.resetAt - Date.now()) / 1000)),
            "x-ratelimit-remaining": "0"
          }
        }
      );
    }

    const limit = await checkAndIncrementScanLimit(getClientIdentifier(request));
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Free scan limit reached. You can run ${limit.limit} scans per day on the free plan.` },
        { status: 429, headers: { "x-scan-limit": String(limit.limit), "x-scan-remaining": "0" } }
      );
    }

    const data = await fetchScanData(chain, address);
    const report = await saveReport(buildRiskReport(data));
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

function isValidAddress(chain: Chain, address: string) {
  if (chain === "solana") {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }

  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
