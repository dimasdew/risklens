import { describe, it, expect } from "vitest";
import { formatUsd, formatAge } from "../format";

describe("formatUsd", () => {
  it("returns 'Unknown' for undefined", () => {
    expect(formatUsd(undefined)).toBe("Unknown");
  });

  it("returns 'Unknown' for 0", () => {
    expect(formatUsd(0)).toBe("Unknown");
  });

  it("formats positive value as USD", () => {
    const result = formatUsd(12345);
    expect(result).toContain("12,345");
    expect(result).toContain("$");
  });

  it("formats large numbers correctly", () => {
    const result = formatUsd(1_500_000);
    expect(result).toContain("1,500,000");
  });
});

describe("formatAge", () => {
  it("returns 'Unknown' for undefined", () => {
    expect(formatAge(undefined)).toBe("Unknown");
  });

  it("formats hours under 48 as hours", () => {
    expect(formatAge(6)).toBe("6h");
    expect(formatAge(0.5)).toBe("1h");
    expect(formatAge(47)).toBe("47h");
  });

  it("formats 48+ hours as days", () => {
    expect(formatAge(48)).toBe("2d");
    expect(formatAge(72)).toBe("3d");
    expect(formatAge(720)).toBe("30d");
  });
});
