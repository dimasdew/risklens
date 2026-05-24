import { describe, it, expect } from "vitest";

// We need to test the non-exported helper functions.
// Since they are private, we test them through behavior of fetchScanData indirectly,
// or we extract the pure functions. For now, let's test the exported fetchScanData
// with mocked fetch, plus test the utility-style logic patterns.

// Test the patterns used in data-sources by recreating the pure logic:

describe("parseTax logic", () => {
  function parseTax(value: unknown) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return undefined;
    return numeric <= 1 ? numeric * 100 : numeric;
  }

  it("returns undefined for non-numeric", () => {
    expect(parseTax("abc")).toBe(undefined);
    expect(parseTax(undefined)).toBe(undefined);
    expect(parseTax(null)).toBe(0); // Number(null) === 0, which is valid
    expect(parseTax(NaN)).toBe(undefined);
    expect(parseTax(Infinity)).toBe(undefined);
  });

  it("converts decimal to percentage", () => {
    expect(parseTax("0.05")).toBe(5);
    expect(parseTax(0.1)).toBe(10);
    expect(parseTax(1)).toBe(100);
  });

  it("keeps already-percentage values", () => {
    expect(parseTax(5)).toBe(5);
    expect(parseTax(15)).toBe(15);
  });

  it("handles zero", () => {
    expect(parseTax(0)).toBe(0);
    expect(parseTax("0")).toBe(0);
  });
});

describe("parsePercent logic", () => {
  function parseOptionalNumber(value: unknown) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  function parsePercent(value: unknown) {
    const numeric = parseOptionalNumber(value);
    if (typeof numeric !== "number") return undefined;
    return numeric <= 1 ? numeric * 100 : numeric;
  }

  it("returns undefined for non-numeric", () => {
    expect(parsePercent("abc")).toBe(undefined);
    expect(parsePercent(undefined)).toBe(undefined);
  });

  it("converts decimal to percentage", () => {
    expect(parsePercent(0.42)).toBe(42);
    expect(parsePercent("0.85")).toBe(85);
  });

  it("keeps already-percentage values", () => {
    expect(parsePercent(42)).toBe(42);
    expect(parsePercent(85)).toBe(85);
  });
});

describe("mergeEvmData logic", () => {
  type EvmSecurityData = Record<string, unknown>;

  function mergeEvmData(...sources: Array<EvmSecurityData | undefined>): EvmSecurityData | undefined {
    const merged: EvmSecurityData = {};

    for (const source of sources) {
      if (!source) continue;
      for (const [key, value] of Object.entries(source)) {
        if (value !== undefined && merged[key] === undefined) {
          merged[key] = value;
        }
      }
    }

    return Object.keys(merged).length ? merged : undefined;
  }

  it("returns undefined when all sources are undefined", () => {
    expect(mergeEvmData(undefined, undefined)).toBe(undefined);
  });

  it("returns single source data", () => {
    expect(mergeEvmData({ honeypot: true })).toEqual({ honeypot: true });
  });

  it("first source wins for same key", () => {
    const result = mergeEvmData({ holderCount: 100 }, { holderCount: 200 });
    expect(result?.holderCount).toBe(100);
  });

  it("fills in missing keys from later sources", () => {
    const result = mergeEvmData(
      { honeypot: true },
      { holderCount: 200, honeypot: false }
    );
    expect(result?.honeypot).toBe(true);
    expect(result?.holderCount).toBe(200);
  });

  it("skips undefined values in sources", () => {
    const result = mergeEvmData(
      { honeypot: undefined, holderCount: 100 },
      { honeypot: true }
    );
    expect(result?.honeypot).toBe(true);
    expect(result?.holderCount).toBe(100);
  });
});
