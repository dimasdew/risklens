import { describe, it, expect } from "vitest";
import { buildRiskReport } from "../risk-engine";
import type { ScanData } from "../types";

function makeScanData(overrides: Partial<ScanData> = {}): ScanData {
  return {
    chain: "solana",
    address: "So11111111111111111111111111111111111111112",
    dataSources: ["DexScreener"],
    ...overrides
  };
}

describe("buildRiskReport", () => {
  it("returns LOW risk when no warnings are triggered", () => {
    const data = makeScanData({
      market: { pairAddress: "pair1", liquidityUsd: 500_000, pairAgeHours: 720 }
    });
    const report = buildRiskReport(data);
    expect(report.riskLevel).toBe("LOW");
    expect(report.score).toBe(0);
    expect(report.warnings).toHaveLength(0);
    expect(report.generatedAt).toBeDefined();
  });

  it("flags Solana mint authority as HIGH", () => {
    const data = makeScanData({
      solana: { mintAuthorityActive: true },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "Mint authority is still active")).toBe(true);
    expect(report.warnings.find((w) => w.title === "Mint authority is still active")?.severity).toBe("HIGH");
  });

  it("flags Solana freeze authority as HIGH", () => {
    const data = makeScanData({
      solana: { freezeAuthorityActive: true },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "Freeze authority is still active")).toBe(true);
  });

  it("flags EVM honeypot as CRITICAL", () => {
    const data = makeScanData({
      chain: "ethereum",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      evm: { honeypot: true },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    const honeypotWarning = report.warnings.find((w) => w.title === "Possible honeypot detected");
    expect(honeypotWarning).toBeDefined();
    expect(honeypotWarning?.severity).toBe("CRITICAL");
  });

  it("flags EVM blacklist controls", () => {
    const data = makeScanData({
      chain: "base",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      evm: { canBlacklist: true },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "Blacklist controls detected")).toBe(true);
  });

  it("flags EVM mintable token", () => {
    const data = makeScanData({
      chain: "ethereum",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      evm: { mintable: true },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "Mint capability detected")).toBe(true);
  });

  it("flags EVM high trading tax", () => {
    const data = makeScanData({
      chain: "bsc",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      evm: { sellTax: 20, buyTax: 5 },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "High trading tax")).toBe(true);
  });

  it("flags EVM proxy contract", () => {
    const data = makeScanData({
      chain: "ethereum",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      evm: { proxy: true },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "Upgradeable proxy detected")).toBe(true);
  });

  it("flags EVM dev/owner wallet holding", () => {
    const data = makeScanData({
      chain: "ethereum",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      evm: { creatorBalancePct: 15 },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "Dev or owner wallet holds significant supply")).toBe(true);
  });

  it("flags EVM low holder count", () => {
    const data = makeScanData({
      chain: "ethereum",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      evm: { holderCount: 30 },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "Low holder count")).toBe(true);
  });

  it("flags top 10 holders controlling most supply (>=70%)", () => {
    const data = makeScanData({
      solana: { top10HolderPct: 75 },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    const warning = report.warnings.find((w) => w.title === "Top 10 holders control most supply");
    expect(warning).toBeDefined();
    expect(warning?.severity).toBe("HIGH");
  });

  it("flags high top holder concentration (50-70%)", () => {
    const data = makeScanData({
      solana: { top10HolderPct: 55 },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "High top holder concentration")).toBe(true);
  });

  it("flags single wallet concentration risk", () => {
    const data = makeScanData({
      solana: { largestHolderPct: 30 },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "Single wallet concentration risk")).toBe(true);
  });

  it("flags low liquidity", () => {
    const data = makeScanData({
      market: { pairAddress: "pair1", liquidityUsd: 5_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "Low liquidity")).toBe(true);
  });

  it("flags unverified liquidity", () => {
    const data = makeScanData({
      market: { pairAddress: "pair1", pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "Liquidity is not verified")).toBe(true);
  });

  it("flags very new trading pair", () => {
    const data = makeScanData({
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 6 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "Very new trading pair")).toBe(true);
  });

  it("flags new pump.fun launch", () => {
    const data = makeScanData({
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 6, dex: "pumpfun" }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "New pump.fun launch")).toBe(true);
  });

  it("flags high early trading velocity", () => {
    const data = makeScanData({
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 1, buys1h: 100, sells1h: 80 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "High early trading velocity")).toBe(true);
  });

  it("flags no active DEX pair", () => {
    const data = makeScanData();
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "No active DEX pair found")).toBe(true);
  });

  it("flags Solana high recent wallet activity", () => {
    const data = makeScanData({
      solana: { recentActiveWallets: 100 },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 6 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "High recent wallet activity")).toBe(true);
  });

  it("flags Solana concentrated recent tx activity", () => {
    const data = makeScanData({
      solana: { recentTxCount: 150, recentTransferWallets: 10 },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "Concentrated recent transaction activity")).toBe(true);
  });

  it("flags EVM high recent wallet activity", () => {
    const data = makeScanData({
      chain: "base",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      evm: { recentActiveWallets: 100 },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 6 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "High recent EVM wallet activity")).toBe(true);
  });

  it("flags EVM concentrated transfer activity", () => {
    const data = makeScanData({
      chain: "ethereum",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      evm: { recentTxCount: 150, recentTransferWallets: 10 },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.warnings.some((w) => w.title === "Concentrated EVM transfer activity")).toBe(true);
  });
});

describe("score and risk level mapping", () => {
  it("score is capped at 100", () => {
    const data = makeScanData({
      chain: "ethereum",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      evm: {
        honeypot: true,
        canBlacklist: true,
        mintable: true,
        ownerActive: true,
        proxy: true,
        sellTax: 50,
        creatorBalancePct: 30,
        holderCount: 10,
        top10HolderPct: 90,
        largestHolderPct: 60
      },
      market: { pairAddress: "pair1", liquidityUsd: 5_000, pairAgeHours: 1, buys1h: 200, sells1h: 100 }
    });
    const report = buildRiskReport(data);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(report.riskLevel).toBe("CRITICAL");
  });

  it("returns MEDIUM for moderate warnings", () => {
    const data = makeScanData({
      chain: "ethereum",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      evm: { ownerActive: true },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.riskLevel).toBe("MEDIUM");
    expect(report.score).toBeGreaterThanOrEqual(25);
    expect(report.score).toBeLessThan(60);
  });

  it("includes points in each warning", () => {
    const data = makeScanData({
      solana: { mintAuthorityActive: true, freezeAuthorityActive: true }
    });
    const report = buildRiskReport(data);
    for (const warning of report.warnings) {
      expect(typeof warning.points).toBe("number");
    }
  });
});

describe("confidence", () => {
  it("returns HIGH when 3+ sources with liquidity, holder, and activity data", () => {
    const data = makeScanData({
      dataSources: ["DexScreener", "Helius RPC", "Helius"],
      solana: { top10HolderPct: 40, recentTxCount: 50 },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.confidence).toBe("HIGH");
  });

  it("returns MEDIUM when 2+ sources with holder or activity data", () => {
    const data = makeScanData({
      dataSources: ["DexScreener", "Helius RPC"],
      solana: { top10HolderPct: 40 },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.confidence).toBe("MEDIUM");
  });

  it("returns LIMITED when insufficient data", () => {
    const data = makeScanData({
      dataSources: ["DexScreener"],
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    const report = buildRiskReport(data);
    expect(report.confidence).toBe("LIMITED");
  });
});

describe("summary", () => {
  it("returns appropriate summary for each risk level", () => {
    const lowData = makeScanData({
      market: { pairAddress: "pair1", liquidityUsd: 500_000, pairAgeHours: 720 }
    });
    expect(buildRiskReport(lowData).summary).toContain("No major automated warnings");

    const criticalData = makeScanData({
      chain: "ethereum",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      evm: { honeypot: true, canBlacklist: true, mintable: true },
      market: { pairAddress: "pair1", liquidityUsd: 100_000, pairAgeHours: 48 }
    });
    expect(buildRiskReport(criticalData).summary).toContain("Critical");
  });
});
