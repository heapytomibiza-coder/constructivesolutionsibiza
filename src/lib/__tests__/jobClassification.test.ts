import { describe, it, expect } from "vitest";
import {
  classifyJobDisplayType,
  getJobDisplayCopy,
  jobDisplayTypeBadgeVariant,
} from "@/lib/jobClassification";

describe("classifyJobDisplayType", () => {
  it("returns QUICK_QUOTE by default with sufficient description", () => {
    expect(
      classifyJobDisplayType({
        flags: [],
        description: "Replace a single broken roof tile on a flat extension roof, easy access.",
      }),
    ).toBe("QUICK_QUOTE");
  });

  it("returns COMPLEX_PROJECT when MULTI_TRADE flag present", () => {
    expect(classifyJobDisplayType({ flags: ["MULTI_TRADE"] })).toBe("COMPLEX_PROJECT");
  });

  it("returns COMPLEX_PROJECT for STRUCTURAL_WORK / PHASED / MULTIPLE_VISITS", () => {
    for (const flag of ["STRUCTURAL_WORK", "PHASED_WORK_REQUIRED", "MULTIPLE_VISITS_REQUIRED"]) {
      expect(classifyJobDisplayType({ flags: [flag] })).toBe("COMPLEX_PROJECT");
    }
  });

  it("returns SITE_VISIT_REQUIRED when inspection_bias is high", () => {
    expect(classifyJobDisplayType({ inspection_bias: "high" })).toBe("SITE_VISIT_REQUIRED");
  });

  it("returns SITE_VISIT_REQUIRED when computed_inspection_bias is mandatory", () => {
    expect(classifyJobDisplayType({ computed_inspection_bias: "mandatory" })).toBe(
      "SITE_VISIT_REQUIRED",
    );
  });

  it("returns SITE_VISIT_REQUIRED for inspection-implying flags", () => {
    for (const flag of [
      "QUOTE_SUBJECT_TO_INSPECTION",
      "SITE_VISIT_REQUIRED",
      "NEW_PIPEWORK_NEEDED",
      "HIDDEN_CONDITIONS_LIKELY",
    ]) {
      expect(
        classifyJobDisplayType({
          flags: [flag],
          description: "A long enough description to clear the clarity threshold value here.",
        }),
      ).toBe("SITE_VISIT_REQUIRED");
    }
  });

  it("returns NEEDS_CLARIFICATION for short/empty description", () => {
    expect(classifyJobDisplayType({ description: "fix it" })).toBe("NEEDS_CLARIFICATION");
    expect(classifyJobDisplayType({ description: "" })).toBe("NEEDS_CLARIFICATION");
    expect(classifyJobDisplayType({ description: null })).toBe("NEEDS_CLARIFICATION");
  });

  it("returns NEEDS_CLARIFICATION for clarity flags", () => {
    for (const flag of ["SCOPE_UNCLEAR", "MISSING_MEASUREMENTS", "MISSING_PHOTOS"]) {
      expect(
        classifyJobDisplayType({
          flags: [flag],
          description: "A long enough description to clear the clarity threshold value here.",
        }),
      ).toBe("NEEDS_CLARIFICATION");
    }
  });

  it("complex flag wins over inspection and clarity", () => {
    expect(
      classifyJobDisplayType({
        flags: ["MULTI_TRADE", "QUOTE_SUBJECT_TO_INSPECTION", "SCOPE_UNCLEAR"],
        inspection_bias: "high",
        description: "x",
      }),
    ).toBe("COMPLEX_PROJECT");
  });

  it("inspection wins over clarity when no complex flag", () => {
    expect(
      classifyJobDisplayType({
        flags: ["SCOPE_UNCLEAR"],
        inspection_bias: "high",
      }),
    ).toBe("SITE_VISIT_REQUIRED");
  });

  it("does not throw on missing / null / undefined input", () => {
    expect(() => classifyJobDisplayType(undefined)).not.toThrow();
    expect(() => classifyJobDisplayType(null)).not.toThrow();
    expect(() => classifyJobDisplayType({})).not.toThrow();
    expect(() =>
      classifyJobDisplayType({ flags: null, interpretation_flags: null, description: null }),
    ).not.toThrow();
  });

  it("accepts interpretation_flags alias", () => {
    expect(
      classifyJobDisplayType({ interpretation_flags: ["MULTI_TRADE"] }),
    ).toBe("COMPLEX_PROJECT");
  });
});

describe("getJobDisplayCopy", () => {
  it("returns audience-specific copy", () => {
    const proCopy = getJobDisplayCopy("QUICK_QUOTE", "pro");
    const clientCopy = getJobDisplayCopy("QUICK_QUOTE", "client");
    const adminCopy = getJobDisplayCopy("QUICK_QUOTE", "admin");
    expect(proCopy.description).not.toEqual(clientCopy.description);
    expect(adminCopy.description).not.toEqual(clientCopy.description);
  });

  it("defaults to pro audience", () => {
    expect(getJobDisplayCopy("COMPLEX_PROJECT")).toEqual(
      getJobDisplayCopy("COMPLEX_PROJECT", "pro"),
    );
  });
});

describe("jobDisplayTypeBadgeVariant", () => {
  it("only returns variants supported by the Badge component", () => {
    const allowed = new Set(["success", "secondary", "warning", "outline"]);
    for (const t of [
      "QUICK_QUOTE",
      "SITE_VISIT_REQUIRED",
      "COMPLEX_PROJECT",
      "NEEDS_CLARIFICATION",
    ] as const) {
      expect(allowed.has(jobDisplayTypeBadgeVariant(t))).toBe(true);
    }
  });
});
