import { describe, it, expect } from "vitest";
import { getSecuritySignals } from "../signals";
import type { ScanReport } from "../types";

function makeReport(overrides: Partial<ScanReport> = {}): ScanReport {
  return {
    chain: "solana",
    address: "So11111111111111111111111111111111111111112",
    dataSources: ["DexScreener"],
    riskLevel: "LOW",
    confidence: "LIMITED",
    score: 0,
    warnings: [],
    summary: "Test",
    generatedAt: new Date().toISOString(),
    ...overrides
  };
}

describe("getSecuritySignals", () => {
  it("returns empty array when all values are unknown", () => {
    const report = makeReport();
    const signals = getSecuritySignals(report);
    // Should still have authority risk since it returns "No active authority found"
    expect(signals.every((s) => s.value !== "Unknown")).toBe(true);
  });

  it("includes top 10 holders for Solana", () => {
    const report = makeReport({ solana: { top10HolderPct: 42.5 } });
    const signals = getSecuritySignals(report);
    const top10 = signals.find((s) => s.label === "Top 10 holders");
    expect(top10).toBeDefined();
    expect(top10?.value).toBe("42.5%");
  });

  it("includes authority risk for Solana with mint active", () => {
    const report = makeReport({ solana: { mintAuthorityActive: true } });
    const signals = getSecuritySignals(report);
    const authority = signals.find((s) => s.label === "Authority risk");
    expect(authority?.value).toBe("Mint active");
  });

  it("includes authority risk for Solana with both active", () => {
    const report = makeReport({ solana: { mintAuthorityActive: true, freezeAuthorityActive: true } });
    const signals = getSecuritySignals(report);
    const authority = signals.find((s) => s.label === "Authority risk");
    expect(authority?.value).toBe("Mint + freeze active");
  });

  it("includes EVM authority risk signals", () => {
    const report = makeReport({
      chain: "ethereum",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      evm: { ownerActive: true, mintable: true }
    });
    const signals = getSecuritySignals(report);
    const authority = signals.find((s) => s.label === "Authority risk");
    expect(authority?.value).toBe("Multiple owner powers");
  });

  it("includes 1h buys/sells when present", () => {
    const report = makeReport({
      market: { buys1h: 50, sells1h: 30 }
    });
    const signals = getSecuritySignals(report);
    const buySell = signals.find((s) => s.label === "1h buys/sells");
    expect(buySell?.value).toBe("50/30");
  });

  it("filters out Unknown values", () => {
    const report = makeReport();
    const signals = getSecuritySignals(report);
    expect(signals.every((s) => s.value !== "Unknown")).toBe(true);
  });
});
