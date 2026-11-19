import { describe, expect, it } from "vitest";
import {
  clamp,
  formatBytes,
  formatDate,
  initialsOf,
  pluralize,
  slugify,
  truncate,
} from "@/lib/format";

describe("format utilities", () => {
  it("formats byte values across unit boundaries", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1_536)).toBe("1.5 KB");
    expect(formatBytes(12 * 1024 * 1024)).toBe("12.0 MB");
  });

  it("normalizes dates and falls back for invalid values", () => {
    expect(formatDate("2026-03-09T12:00:00.000Z", "yyyy-MM-dd")).toBe("2026-03-09");
    expect(formatDate("not-a-date")).toBe("—");
  });

  it("builds initials from the first two name parts", () => {
    expect(initialsOf("Dr. Maya Chen")).toBe("DM");
    expect(initialsOf("  Ada  ")).toBe("A");
    expect(initialsOf("")).toBe("");
  });

  it("clamps and pluralizes numbers", () => {
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(-2, 0, 10)).toBe(0);
    expect(pluralize(1, "project")).toBe("1 project");
    expect(pluralize(2_500, "paper")).toBe("2,500 papers");
  });

  it("slugifies and truncates strings predictably", () => {
    expect(slugify("  Cortical Dynamics: Phase 2  ")).toBe("cortical-dynamics-phase-2");
    expect(truncate("A short note", 40)).toBe("A short note");
    expect(truncate("A deliberately long research note", 12)).toBe("A deliberate…");
  });
});
