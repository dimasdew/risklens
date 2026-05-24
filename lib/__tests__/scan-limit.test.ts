import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase so it's never configured during tests
vi.stubEnv("SUPABASE_URL", "");
vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

// Dynamic import after env stub
const { checkAndIncrementScanLimit } = await import("../scan-limit");

describe("checkAndIncrementScanLimit (local)", () => {
  beforeEach(() => {
    // Each test gets a unique identifier to avoid cross-test pollution
  });

  it("allows the first scan", async () => {
    const id = `test-${Date.now()}-${Math.random()}`;
    const result = await checkAndIncrementScanLimit(id);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(49);
    expect(result.limit).toBe(50);
  });

  it("decrements remaining on subsequent scans", async () => {
    const id = `test-${Date.now()}-${Math.random()}`;
    await checkAndIncrementScanLimit(id);
    const result = await checkAndIncrementScanLimit(id);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(48);
  });

  it("blocks after 50 scans", async () => {
    const id = `test-exhaust-${Date.now()}-${Math.random()}`;
    for (let i = 0; i < 50; i++) {
      const r = await checkAndIncrementScanLimit(id);
      expect(r.allowed).toBe(true);
    }
    const blocked = await checkAndIncrementScanLimit(id);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("different identifiers have separate limits", async () => {
    const id1 = `test-a-${Date.now()}-${Math.random()}`;
    const id2 = `test-b-${Date.now()}-${Math.random()}`;

    await checkAndIncrementScanLimit(id1);
    await checkAndIncrementScanLimit(id1);
    const r1 = await checkAndIncrementScanLimit(id1);
    const r2 = await checkAndIncrementScanLimit(id2);

    expect(r1.remaining).toBe(47);
    expect(r2.remaining).toBe(49);
  });
});
