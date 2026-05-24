import { describe, it, expect } from "vitest";
import { checkRateLimit } from "../rate-limit";

describe("checkRateLimit", () => {
  it("allows the first request", () => {
    const id = `test-${Date.now()}-${Math.random()}`;
    const result = checkRateLimit(id);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("decrements remaining on subsequent requests", () => {
    const id = `test-${Date.now()}-${Math.random()}`;
    checkRateLimit(id);
    const result = checkRateLimit(id);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(8);
  });

  it("blocks after 10 requests in same window", () => {
    const id = `test-burst-${Date.now()}-${Math.random()}`;
    for (let i = 0; i < 10; i++) {
      const r = checkRateLimit(id);
      expect(r.allowed).toBe(true);
    }
    const blocked = checkRateLimit(id);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("different identifiers have separate limits", () => {
    const id1 = `test-a-${Date.now()}-${Math.random()}`;
    const id2 = `test-b-${Date.now()}-${Math.random()}`;

    for (let i = 0; i < 5; i++) checkRateLimit(id1);

    const r1 = checkRateLimit(id1);
    const r2 = checkRateLimit(id2);

    expect(r1.remaining).toBe(4);
    expect(r2.remaining).toBe(9);
  });

  it("returns resetAt timestamp in the future", () => {
    const id = `test-reset-${Date.now()}-${Math.random()}`;
    const result = checkRateLimit(id);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });
});
