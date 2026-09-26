import { describe, expect, it } from "vitest";
import { buildDailyRecords, type DailyRecordsInput } from "@/lib/dailyRecords";
import { PENALTY_YEN } from "@/lib/config";

/** 2026-08-N の指定時刻。実行環境のタイムゾーンは vitest.config.mts で JST に固定している */
const at = (day: number, hour: number, minute = 0, second = 0, millisecond = 0): Date =>
  new Date(2026, 7, day, hour, minute, second, millisecond);

const day = (day: number): Date => new Date(2026, 7, day);

/** 期間は 8/1〜8/10、期限は 7:30、デポジットはペナルティ 6 回分 */
const CHALLENGE: DailyRecordsInput = {
  depositYen: PENALTY_YEN * 6,
  startDate: day(1),
  endDate: day(10),
  deadline: { hour: 7, minute: 30 },
};

/** `@db.Date` を読み込むと、UTC の 0 時になる（JST では 9 時） */
const fromDb = (d: number): Date => new Date(Date.UTC(2026, 7, d));

const summarize = (records: ReturnType<typeof buildDailyRecords>) =>
  records.map((r) => `${r.date.getDate()}:${r.result}`);

describe("buildDailyRecords", () => {
  it("開始日の期限前で、チェックインもなければ空", () => {
    expect(buildDailyRecords(at(1, 6), CHALLENGE, [])).toEqual([]);
  });

  it("期限を過ぎてチェックインしていない日は失敗", () => {
    expect(summarize(buildDailyRecords(at(3, 6), CHALLENGE, []))).toEqual([
      "2:failure",
      "1:failure",
    ]);
  });

  it("チェックインした日は成功。新しい日が先頭に来る", () => {
    const records = buildDailyRecords(at(4, 6), CHALLENGE, [fromDb(1), fromDb(3)]);
    expect(summarize(records)).toEqual(["3:success", "2:failure", "1:success"]);
  });

  it("期限前の今日にチェックイン済みなら、今日を成功として載せる", () => {
    const records = buildDailyRecords(at(3, 6), CHALLENGE, [fromDb(1), fromDb(2), fromDb(3)]);
    expect(summarize(records)).toEqual(["3:success", "2:success", "1:success"]);
  });

  it("期限前の今日にチェックインしていなければ、今日は載せない", () => {
    expect(summarize(buildDailyRecords(at(3, 6), CHALLENGE, [fromDb(1), fromDb(2)]))).toEqual([
      "2:success",
      "1:success",
    ]);
  });

  it("期限ちょうどを迎えた日は、未チェックインなら失敗に数える（期限を過ぎた日数の数え方と同じ）", () => {
    expect(summarize(buildDailyRecords(at(1, 7, 30), CHALLENGE, []))).toEqual(["1:failure"]);
    expect(buildDailyRecords(at(1, 7, 29, 59, 999), CHALLENGE, [])).toEqual([]);
  });

  it("期間の最終日を過ぎたら、終了日までで頭打ちになる", () => {
    const allDays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(fromDb);
    const records = buildDailyRecords(at(20, 12), CHALLENGE, allDays);
    expect(records).toHaveLength(10);
    expect(records.every((r) => r.result === "success")).toBe(true);
  });

  describe("早期失敗", () => {
    it("デポジットが吸収できる回数に達した日で打ち切り、それ以降は載せない", () => {
      // ペナルティ 6 回分。8/6 の期限で 6 回目の失敗になり、8/7 以降は数えない
      const records = buildDailyRecords(at(9, 12), CHALLENGE, []);
      expect(summarize(records)).toEqual([
        "6:failure",
        "5:failure",
        "4:failure",
        "3:failure",
        "2:failure",
        "1:failure",
      ]);
    });

    it("成功した日は失敗回数に数えず、その分だけ打ち切りが後ろにずれる", () => {
      const records = buildDailyRecords(at(9, 12), CHALLENGE, [fromDb(1)]);
      expect(summarize(records)).toEqual([
        "7:failure",
        "6:failure",
        "5:failure",
        "4:failure",
        "3:failure",
        "2:failure",
        "1:success",
      ]);
    });
  });

  it("失敗回数は、日ごとの記録の失敗の数と集計の値が一致する", () => {
    const records = buildDailyRecords(at(6, 12), CHALLENGE, [fromDb(2), fromDb(5)]);
    expect(records.filter((r) => r.result === "failure")).toHaveLength(4);
  });
});
