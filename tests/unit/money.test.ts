import { describe, expect, it } from "vitest";
import { formatMinor, minorToInputValue, parseAmountToMinor, MAX_MINOR } from "@/lib/money";

describe("money", () => {
  it("parses without floating point error", () => {
    expect(parseAmountToMinor("0.10", "USD")).toBe(10);
    expect(parseAmountToMinor("1,250.50", "USD")).toBe(125050);
    expect(parseAmountToMinor("19.99", "USD")).toBe(1999);
    expect(parseAmountToMinor("5", "USD")).toBe(500);
  });
  it("never silently rounds extra decimals or accepts junk", () => {
    expect(parseAmountToMinor("1.999", "USD")).toBeNull();
    expect(parseAmountToMinor("-5", "USD")).toBeNull();
    expect(parseAmountToMinor("1e6", "USD")).toBeNull();
    expect(parseAmountToMinor("abc", "USD")).toBeNull();
    expect(parseAmountToMinor("", "USD")).toBeNull();
  });
  it("respects zero-decimal currencies", () => {
    expect(parseAmountToMinor("1500", "JPY")).toBe(1500);
    expect(parseAmountToMinor("1500.5", "JPY")).toBeNull();
    expect(formatMinor(1500, "JPY")).toBe("JPY 1,500");
  });
  it("formats and round-trips", () => {
    expect(formatMinor(125050, "EUR")).toBe("EUR 1,250.50");
    expect(formatMinor(5, "USD")).toBe("USD 0.05");
    expect(minorToInputValue(125050, "USD")).toBe("1250.50");
  });
  it("enforces the ceiling", () => {
    expect(parseAmountToMinor("99999999999", "USD")).toBeNull();
    expect(MAX_MINOR).toBeLessThan(2 ** 31);
  });
});
