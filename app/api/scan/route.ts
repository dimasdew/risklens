import { NextResponse } from "next/server";
import { fetchScanData } from "@/lib/data-sources";
import { saveReport } from "@/lib/report-store";
import { buildRiskReport } from "@/lib/risk-engine";
import { checkAndIncrementScanLimit } from "@/lib/scan-limit";
import type { Chain } from "@/lib/types";

const chains = new Set<Chain>(["solana", "base", "bsc", "ethereum"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { chain?: Chain; address?: string };
    const chain = body.chain;
    const address = body.address?.trim();

    if (!chain || !chains.has(chain)) {
      return NextResponse.json({ error: "Unsupported chain." }, { status: 400 });
    }

    if (!address || !isValidAddress(chain, address)) {
      return NextResponse.json({ error: "Invalid token address for selected chain." }, { status: 400 });
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

function getClientIdentifier(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}

function isValidAddress(chain: Chain, address: string) {
  if (chain === "solana") {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }

  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
