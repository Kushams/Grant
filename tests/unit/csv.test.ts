import { describe, expect, it } from "vitest";
import { csvFilename, escapeCsv, toCsv } from "@/lib/csv";

describe("csv", () => {
  it("neutralises spreadsheet formula injection", () => {
    for (const evil of ["=SUM(A1:A9)", "+1+1", "-2+3", "@cmd", "\t=1", "  =1+1", "\r=1"]) {
      const cell = escapeCsv(evil);
      expect(cell.replace(/^"/, "").startsWith("'")).toBe(true);
    }
  });
  it("leaves harmless text and numbers alone", () => {
    expect(escapeCsv("Hello")).toBe("Hello");
    expect(escapeCsv(42)).toBe("42");
    expect(escapeCsv(-5)).toBe("-5");
    expect(escapeCsv(null)).toBe("");
  });
  it("quotes commas, quotes and newlines", () => {
    expect(escapeCsv('a,"b"\nc')).toBe('"a,""b""\nc"');
  });
  it("builds a document with BOM and CRLF", () => {
    const out = toCsv(["a", "b"], [["=x", "y"]]);
    expect(out.startsWith("﻿")).toBe(true);
    expect(out).toContain("a,b\r\n'=x,y\r\n");
  });
  it("makes safe filenames", () => {
    expect(csvFilename("Award Records!", new Date("2026-03-04T00:00:00Z"))).toBe("nen-award-records--2026-03-04.csv");
  });
});
