import { describe, expect, it } from "vitest";
import { formatDate, formatTime, formatYen } from "@/lib/format";

describe("formatYen", () => {
  it("3桁ごとにカンマで区切る", () => {
    expect(formatYen(5500)).toBe("5,500");
    expect(formatYen(30000)).toBe("30,000");
  });

  it("0 円も出せる", () => {
    expect(formatYen(0)).toBe("0");
  });
});

describe("formatTime", () => {
  it("1桁の時・分は 0 で埋める", () => {
    expect(formatTime(7, 5)).toBe("07:05");
  });

  it("2桁はそのまま", () => {
    expect(formatTime(12, 30)).toBe("12:30");
  });
});

describe("formatDate", () => {
  it("YYYY-MM-DD で表し、月・日は 0 で埋める", () => {
    expect(formatDate(new Date(2026, 7, 5))).toBe("2026-08-05");
  });

  it("年末の日付もずれない", () => {
    expect(formatDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});
