import { describe, it, expect } from "vitest";
import { classifyIntent } from "../searchIntent";

describe("searchIntent — classifyIntent", () => {
  // ── TRADE queries ──────────────────────────────────
  describe("TRADE intent", () => {
    const cases = [
      "plumber",
      "plumber near me",
      "best electrician ibiza",
      "emergency cleaner",
      "fontanería",        // accent folding
      "fontaneria",
      "plumber,",          // punctuation
      "electrician?",
      "cheap handyman",
      "architect ibiza",
    ];
    it.each(cases)('"%s" → TRADE', (q) => {
      expect(classifyIntent(q)).toBe("TRADE");
    });
  });

  // ── TASK queries ───────────────────────────────────
  describe("TASK intent", () => {
    const cases = [
      "fix leaking tap",
      "replace boiler",
      "install lighting",
      "reparar cisterna",
    ];
    it.each(cases)('"%s" → TASK', (q) => {
      expect(classifyIntent(q)).toBe("TASK");
    });
  });

  // ── PROJECT queries ────────────────────────────────
  describe("PROJECT intent", () => {
    const cases = [
      "kitchen renovation",
      "new bathroom",
      "redo kitchen",
      "office fit out",
      "reforma de baño",   // accent folding
      "reforma de bano",
    ];
    it.each(cases)('"%s" → PROJECT', (q) => {
      expect(classifyIntent(q)).toBe("PROJECT");
    });
  });

  // ── EXPLORATORY / EDGE queries ─────────────────────
  describe("EXPLORATORY or contextual edge cases", () => {
    it('"pool cleaning" → TRADE (cleaner/cleaning is a trade term)', () => {
      expect(classifyIntent("pool cleaning")).toBe("TRADE");
    });

    it('"aircon repair" → TASK (repair is a task verb)', () => {
      expect(classifyIntent("aircon repair")).toBe("TASK");
    });

    it('"bathroom fitter" → EXPLORATORY (no exact trade or verb)', () => {
      // "fitter" is not in TRADE_TERMS, "bathroom" alone is not a trade
      expect(classifyIntent("bathroom fitter")).toBe("EXPLORATORY");
    });

    it('"legal advice" → EXPLORATORY', () => {
      expect(classifyIntent("legal advice")).toBe("EXPLORATORY");
    });
  });

  // ── Normalization ──────────────────────────────────
  describe("normalization", () => {
    it("handles accented input", () => {
      expect(classifyIntent("fontanería")).toBe("TRADE");
    });
    it("handles trailing punctuation", () => {
      expect(classifyIntent("plumber!")).toBe("TRADE");
    });
    it("handles mixed case + extra spaces", () => {
      expect(classifyIntent("  Best  ELECTRICIAN  ")).toBe("TRADE");
    });
    it("empty string → EXPLORATORY", () => {
      expect(classifyIntent("")).toBe("EXPLORATORY");
    });
  });
});
