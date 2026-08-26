import { describe, expect, it } from "vitest";
import { countDaysPastDeadline, lastDayPastDeadline } from "@/lib/deadlineDays";
import type { DeadlineTime } from "@/lib/checkInWindow";

/** 2026-08-N の指定時刻。実行環境のタイムゾーンは vitest.config.mts で JST に固定している */
const at = (day: number, hour: number, minute = 0, second = 0, millisecond = 0): Date =>
  new Date(2026, 7, day, hour, minute, second, millisecond);

/** 時刻を持たない、日付だけの `Date`（0時） */
const day = (day: number): Date => new Date(2026, 7, day);

const DEADLINE: DeadlineTime = { hour: 7, minute: 30 };

describe("countDaysPastDeadline", () => {
  it("開始日当日、期限前なら 0", () => {
    const now = at(1, 7, 29, 59, 999);
    expect(countDaysPastDeadline(now, day(1), day(10), DEADLINE)).toBe(0);
  });

  it("開始日当日、期限ちょうどなら 1", () => {
    const now = at(1, 7, 30, 0, 0);
    expect(countDaysPastDeadline(now, day(1), day(10), DEADLINE)).toBe(1);
  });

  it("開始日当日、期限の 1 ミリ秒後なら 1", () => {
    const now = at(1, 7, 30, 0, 1);
    expect(countDaysPastDeadline(now, day(1), day(10), DEADLINE)).toBe(1);
  });

  it("開始日の翌日、まだその日の期限前なら 1（前日の分だけ）", () => {
    const now = at(2, 7, 29, 59, 999);
    expect(countDaysPastDeadline(now, day(1), day(10), DEADLINE)).toBe(1);
  });

  it("開始日の翌日、その日の期限も過ぎていれば 2", () => {
    const now = at(2, 7, 30, 0, 0);
    expect(countDaysPastDeadline(now, day(1), day(10), DEADLINE)).toBe(2);
  });

  it("終了日当日、期限を過ぎていれば期間の全日数", () => {
    const now = at(10, 7, 30, 0, 0);
    expect(countDaysPastDeadline(now, day(1), day(10), DEADLINE)).toBe(10);
  });

  it("終了日を過ぎていても、終了日までで頭打ちになる", () => {
    const now = at(20, 12, 0, 0, 0);
    expect(countDaysPastDeadline(now, day(1), day(10), DEADLINE)).toBe(10);
  });

  it("開始日と終了日が同じ日（1日だけの期間）で、期限前なら 0", () => {
    const now = at(1, 7, 29, 59, 999);
    expect(countDaysPastDeadline(now, day(1), day(1), DEADLINE)).toBe(0);
  });

  it("開始日と終了日が同じ日（1日だけの期間）で、期限を過ぎていれば 1", () => {
    const now = at(1, 7, 30, 0, 0);
    expect(countDaysPastDeadline(now, day(1), day(1), DEADLINE)).toBe(1);
  });
});

describe("lastDayPastDeadline", () => {
  it("まだ1日も期限を過ぎていなければ null", () => {
    const now = at(1, 7, 29, 59, 999);
    expect(lastDayPastDeadline(now, day(1), day(10), DEADLINE)).toBeNull();
  });

  it("開始日の期限を過ぎた直後なら開始日", () => {
    const now = at(1, 7, 30, 0, 0);
    expect(lastDayPastDeadline(now, day(1), day(10), DEADLINE)).toEqual(day(1));
  });

  it("当日の期限前なら前日が最終日（当日は含めない）", () => {
    const now = at(5, 6, 0, 0, 0);
    expect(lastDayPastDeadline(now, day(1), day(10), DEADLINE)).toEqual(day(4));
  });

  it("当日の期限を過ぎていれば当日が最終日", () => {
    const now = at(5, 7, 30, 0, 0);
    expect(lastDayPastDeadline(now, day(1), day(10), DEADLINE)).toEqual(day(5));
  });

  it("終了日を過ぎていても終了日で頭打ちになる", () => {
    const now = at(20, 12, 0, 0, 0);
    expect(lastDayPastDeadline(now, day(1), day(10), DEADLINE)).toEqual(day(10));
  });

  it("返すのは時刻を切り捨てた 0 時ちょうど", () => {
    const now = at(5, 12, 34, 56, 789);
    const result = lastDayPastDeadline(now, day(1), day(10), DEADLINE);
    expect(result?.getHours()).toBe(0);
    expect(result?.getMinutes()).toBe(0);
    expect(result?.getSeconds()).toBe(0);
    expect(result?.getMilliseconds()).toBe(0);
  });

  it("最終日までの日数が countDaysPastDeadline と一致する", () => {
    const now = at(5, 6, 0, 0, 0);
    const count = countDaysPastDeadline(now, day(1), day(10), DEADLINE);
    const lastDay = lastDayPastDeadline(now, day(1), day(10), DEADLINE);
    expect(lastDay?.getDate()).toBe(day(1).getDate() + count - 1);
  });
});
