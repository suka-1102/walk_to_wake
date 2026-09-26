import { describe, expect, it } from "vitest";
import { summarizeChallenge, type ChallengeSummaryInput } from "@/lib/challengeSummary";
import { PENALTY_YEN, SYSTEM_FEE_PERCENT } from "@/lib/config";

/** 2026-08-N の指定時刻。実行環境のタイムゾーンは vitest.config.mts で JST に固定している */
const at = (day: number, hour: number, minute = 0, second = 0, millisecond = 0): Date =>
  new Date(2026, 7, day, hour, minute, second, millisecond);

const day = (day: number): Date => new Date(2026, 7, day);

/** 期間は 8/1〜8/10（10日）、期限は 7:30、デポジットはペナルティ 6 回分 */
const DEPOSIT = PENALTY_YEN * 6;
const CHALLENGE: ChallengeSummaryInput = {
  depositYen: DEPOSIT,
  startDate: day(1),
  endDate: day(10),
  deadline: { hour: 7, minute: 30 },
};

describe("summarizeChallenge", () => {
  describe("進行中", () => {
    it("開始日の期限前は、失敗も経過日数もなく、残りは期間の全日数", () => {
      expect(summarizeChallenge(at(1, 6), CHALLENGE, 0)).toMatchObject({
        totalDays: 10,
        daysPastDeadline: 0,
        remainingDays: 10,
        failureCount: 0,
        balanceYen: DEPOSIT,
        isFinished: false,
      });
    });

    it("期限を過ぎた日から残り日数が減る（今日の期限前は今日を残りに含める）", () => {
      // 8/5 6:00: 期限を過ぎたのは 8/1〜8/4 の 4日。8/5 はまだ期限前なので残りに含む
      expect(summarizeChallenge(at(5, 6), CHALLENGE, 4)).toMatchObject({
        daysPastDeadline: 4,
        remainingDays: 6,
      });
    });

    it("失敗は期限を過ぎた日数から成功日数を引いて数える", () => {
      const summary = summarizeChallenge(at(5, 6), CHALLENGE, 2);
      expect(summary.failureCount).toBe(2);
      expect(summary.balanceYen).toBe(DEPOSIT - 2 * PENALTY_YEN);
      expect(summary.isFinished).toBe(false);
    });

    it("進行中の返金額は、このまま満了した場合の残高", () => {
      expect(summarizeChallenge(at(5, 6), CHALLENGE, 2).refundYen).toBe(DEPOSIT - 2 * PENALTY_YEN);
    });
  });

  describe("早期失敗", () => {
    // 8/6 8:00 時点で期限を過ぎたのは 8/1〜8/6 の 6日。全部失敗ならペナルティ 6 回分で残高 0

    it("残高がペナルティ単価を下回った時点で終了し、返金は 0", () => {
      const summary = summarizeChallenge(at(6, 8), CHALLENGE, 0);
      expect(summary).toMatchObject({
        failureCount: 6,
        balanceYen: 0,
        hasFailedEarly: true,
        isPeriodOver: false,
        isFinished: true,
        remainingDays: 0,
        refundYen: 0,
      });
    });

    it("残高がペナルティ単価ちょうど残っていればまだ終了しない（境界）", () => {
      const summary = summarizeChallenge(at(6, 8), CHALLENGE, 1);
      expect(summary.balanceYen).toBe(PENALTY_YEN);
      expect(summary.isFinished).toBe(false);
    });

    it("終了した後の日は失敗として数えない（あとから見ても結果は変わらない）", () => {
      const atFailure = summarizeChallenge(at(6, 8), CHALLENGE, 0);
      const later = summarizeChallenge(at(9, 8), CHALLENGE, 0);
      expect(later.failureCount).toBe(atFailure.failureCount);
      expect(later.balanceYen).toBe(atFailure.balanceYen);
    });

    it("ペナルティ単価に満たない端数が残っても、早期失敗なら返金は 0", () => {
      const summary = summarizeChallenge(
        at(6, 8),
        { ...CHALLENGE, depositYen: DEPOSIT + PENALTY_YEN - 1 },
        0
      );
      expect(summary.balanceYen).toBe(PENALTY_YEN - 1);
      expect(summary.hasFailedEarly).toBe(true);
      expect(summary.refundYen).toBe(0);
    });
  });

  describe("期間満了", () => {
    it("終了日の期限の 1 ミリ秒前はまだ進行中で、残りは 1 日", () => {
      const summary = summarizeChallenge(at(10, 7, 29, 59, 999), CHALLENGE, 9);
      expect(summary).toMatchObject({ isPeriodOver: false, isFinished: false, remainingDays: 1 });
    });

    it("終了日の期限ちょうどで満了し、残高がそのまま返金額になる", () => {
      const summary = summarizeChallenge(at(10, 7, 30), CHALLENGE, 10);
      expect(summary).toMatchObject({
        daysPastDeadline: 10,
        remainingDays: 0,
        isPeriodOver: true,
        isFinished: true,
        failureCount: 0,
        refundYen: DEPOSIT,
      });
    });

    it("満了後にあとから見ても、経過日数は終了日で頭打ちになる", () => {
      expect(summarizeChallenge(at(20, 12), CHALLENGE, 10).daysPastDeadline).toBe(10);
    });

    it("失敗があっても、残高が残ったまま満了すれば残高が返金される", () => {
      const summary = summarizeChallenge(at(10, 8), { ...CHALLENGE, depositYen: PENALTY_YEN * 20 }, 8);
      expect(summary.failureCount).toBe(2);
      expect(summary.isFinished).toBe(true);
      expect(summary.hasFailedEarly).toBe(false);
      expect(summary.refundYen).toBe(PENALTY_YEN * 18);
    });
  });

  describe("システム利用料", () => {
    it("デポジット額に対する率で、円未満は切り捨てる", () => {
      const depositYen = 3333;
      const summary = summarizeChallenge(at(1, 6), { ...CHALLENGE, depositYen }, 0);
      expect(summary.systemFeeYen).toBe(Math.floor((depositYen * SYSTEM_FEE_PERCENT) / 100));
    });

    it("早期失敗でも変わらない（返金対象外）", () => {
      const before = summarizeChallenge(at(1, 6), CHALLENGE, 0).systemFeeYen;
      expect(summarizeChallenge(at(6, 8), CHALLENGE, 0).systemFeeYen).toBe(before);
    });
  });

  it("開始日と終了日が同じなら 1 日のチャレンジ", () => {
    const summary = summarizeChallenge(at(3, 6), { ...CHALLENGE, startDate: day(3), endDate: day(3) }, 0);
    expect(summary).toMatchObject({ totalDays: 1, remainingDays: 1 });
  });
});
