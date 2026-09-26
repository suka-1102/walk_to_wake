import { describe, expect, it } from "vitest";
import { CHECK_IN_START_HOUR } from "@/lib/config";
import { judgeTodayStatus } from "@/lib/todayStatus";

/** 2026-08-N の指定時刻。実行環境のタイムゾーンは vitest.config.mts で JST に固定している */
const at = (day: number, hour: number, minute = 0, second = 0, millisecond = 0): Date =>
  new Date(2026, 7, day, hour, minute, second, millisecond);

/** 開始日は 8/26、期限は 7:30 */
const CHALLENGE = { startDate: new Date(2026, 7, 26), deadline: { hour: 7, minute: 30 } };

describe("judgeTodayStatus", () => {
  it("受付時間内で未チェックインなら open", () => {
    expect(judgeTodayStatus(at(27, 6), CHALLENGE, false)).toBe("open");
  });

  it("期限ちょうどまでは open、1ミリ秒過ぎたら pastDeadline", () => {
    expect(judgeTodayStatus(at(27, 7, 30), CHALLENGE, false)).toBe("open");
    expect(judgeTodayStatus(at(27, 7, 30, 0, 1), CHALLENGE, false)).toBe("pastDeadline");
  });

  it("受付開始時刻の前は beforeWindow", () => {
    expect(judgeTodayStatus(at(27, CHECK_IN_START_HOUR - 1, 59), CHALLENGE, false)).toBe(
      "beforeWindow"
    );
  });

  it("受付開始時刻ちょうどから open", () => {
    expect(judgeTodayStatus(at(27, CHECK_IN_START_HOUR), CHALLENGE, false)).toBe("open");
  });

  it("開始日の前日は、受付時間内でも beforeStart", () => {
    expect(judgeTodayStatus(at(25, 6), CHALLENGE, false)).toBe("beforeStart");
  });

  it("開始日当日は通常どおり判定する", () => {
    expect(judgeTodayStatus(at(26, 6), CHALLENGE, false)).toBe("open");
  });

  it("チェックイン済みなら、時刻にかかわらず checkedIn", () => {
    expect(judgeTodayStatus(at(27, 6), CHALLENGE, true)).toBe("checkedIn");
    expect(judgeTodayStatus(at(27, 12), CHALLENGE, true)).toBe("checkedIn");
  });
});
