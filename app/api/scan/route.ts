import { NextResponse } from "next/server";
import { fetchScanData } from "@/lib/data-sources";
import { saveReport } from "@/lib/report-store";
import { buildRiskReport } from "@/lib/risk-engine";
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

    const data = await fetchScanData(chain, address);
    const report = await saveReport(buildRiskReport(data));
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scan failed." },
      { status: 500 }
    );
  }
}

function isValidAddress(chain: Chain, address: string) {
  if (chain === "solana") {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }

  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
