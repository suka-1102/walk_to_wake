import { describe, expect, it } from "vitest";
import { isWithinCheckInWindow, type DeadlineTime } from "@/lib/checkInWindow";
import { CHECK_IN_START_HOUR } from "@/lib/config";

/** 2026-08-26 の指定時刻。実行環境のタイムゾーンは vitest.config.mts で JST に固定している */
const at = (hour: number, minute = 0, second = 0, millisecond = 0): Date =>
  new Date(2026, 7, 26, hour, minute, second, millisecond);

const DEADLINE: DeadlineTime = { hour: 7, minute: 30 };

describe("isWithinCheckInWindow", () => {
  it("受付開始時刻ちょうどなら true", () => {
    expect(isWithinCheckInWindow(at(CHECK_IN_START_HOUR), DEADLINE)).toBe(true);
  });

  it("受付開始時刻の 1 ミリ秒前なら false", () => {
    expect(isWithinCheckInWindow(at(CHECK_IN_START_HOUR - 1, 59, 59, 999), DEADLINE)).toBe(false);
  });

  it("日付が変わった直後はまだ受付開始前なので false", () => {
    expect(isWithinCheckInWindow(at(0), DEADLINE)).toBe(false);
  });

  it("受付開始時刻と期限時刻のあいだなら true", () => {
    expect(isWithinCheckInWindow(at(6, 0), DEADLINE)).toBe(true);
  });

  it("期限時刻ちょうどなら true", () => {
    expect(isWithinCheckInWindow(at(DEADLINE.hour, DEADLINE.minute), DEADLINE)).toBe(true);
  });

  it("期限時刻の 1 ミリ秒後なら false", () => {
    expect(isWithinCheckInWindow(at(DEADLINE.hour, DEADLINE.minute, 0, 1), DEADLINE)).toBe(false);
  });

  it("期限時刻の 1 秒後なら false", () => {
    expect(isWithinCheckInWindow(at(DEADLINE.hour, DEADLINE.minute, 1), DEADLINE)).toBe(false);
  });

  it("期限時刻を大きく過ぎていれば false", () => {
    expect(isWithinCheckInWindow(at(23, 59, 59, 999), DEADLINE)).toBe(false);
  });

  it("期限時刻が受付開始時刻ちょうどなら、その 1 点だけ true", () => {
    const deadline: DeadlineTime = { hour: CHECK_IN_START_HOUR, minute: 0 };
    expect(isWithinCheckInWindow(at(CHECK_IN_START_HOUR), deadline)).toBe(true);
    expect(isWithinCheckInWindow(at(CHECK_IN_START_HOUR, 0, 0, 1), deadline)).toBe(false);
  });

  it("期限時刻が受付開始時刻より前なら受付時間が存在せず、常に false", () => {
    const deadline: DeadlineTime = { hour: CHECK_IN_START_HOUR - 1, minute: 0 };
    expect(isWithinCheckInWindow(at(CHECK_IN_START_HOUR - 1, 0), deadline)).toBe(false);
    expect(isWithinCheckInWindow(at(CHECK_IN_START_HOUR), deadline)).toBe(false);
  });
});
