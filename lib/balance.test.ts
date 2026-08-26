import { describe, expect, it } from "vitest";
import { calculateChallengeBalance, countFailures } from "@/lib/balance";
import { PENALTY_YEN } from "@/lib/config";

describe("countFailures", () => {
  it("期限を過ぎた日数から成功日数を引いた値を返す", () => {
    expect(countFailures(5, 2)).toBe(3);
  });

  it("すべての日にチェックインできていれば 0", () => {
    expect(countFailures(5, 5)).toBe(0);
  });

  it("まだ1日も期限を過ぎていなければ 0", () => {
    expect(countFailures(0, 0)).toBe(0);
  });

  it("まだ期限が来ていない当日の分は成功日数に含めない", () => {
    // 8/1〜8/10・期限 7:30 のチャレンジを 8/5 6:00 に見た場合。
    // 期限を過ぎたのは 8/1〜8/4 の 4日で、そのうち成功は 8/1・8/2 の 2日。
    // 同じ日の 6:00 に済ませたチェックインを含めて 3 と数えると、失敗が 1 に減ってしまう。
    expect(countFailures(4, 2)).toBe(2);
  });

  it("範囲を取り違えて成功日数のほうが多くなっても、負の値にはならない", () => {
    expect(countFailures(0, 1)).toBe(0);
  });
});

describe("calculateChallengeBalance", () => {
  it("失敗がなければ残高はデポジット額のまま", () => {
    const deposit = PENALTY_YEN * 6;
    expect(
      calculateChallengeBalance({
        depositYen: deposit,
        daysPastDeadline: 3,
        checkInCountPastDeadline: 3,
      })
    ).toEqual({ failureCount: 0, balanceYen: deposit, hasFailedEarly: false });
  });

  it("失敗1回につきペナルティ単価だけ残高が減る", () => {
    const deposit = PENALTY_YEN * 6;
    expect(
      calculateChallengeBalance({
        depositYen: deposit,
        daysPastDeadline: 3,
        checkInCountPastDeadline: 1,
      })
    ).toEqual({
      failureCount: 2,
      balanceYen: deposit - PENALTY_YEN * 2,
      hasFailedEarly: false,
    });
  });

  it("残高がペナルティ単価ちょうどなら早期失敗にならない", () => {
    const result = calculateChallengeBalance({
      depositYen: PENALTY_YEN * 6,
      daysPastDeadline: 5,
      checkInCountPastDeadline: 0,
    });
    expect(result.balanceYen).toBe(PENALTY_YEN);
    expect(result.hasFailedEarly).toBe(false);
  });

  it("残高がペナルティ単価を 1円 でも下回れば早期失敗", () => {
    const result = calculateChallengeBalance({
      depositYen: PENALTY_YEN * 7 - 1,
      daysPastDeadline: 6,
      checkInCountPastDeadline: 0,
    });
    expect(result.balanceYen).toBe(PENALTY_YEN - 1);
    expect(result.hasFailedEarly).toBe(true);
  });

  it("残高が 0円 になっても早期失敗として扱う", () => {
    const result = calculateChallengeBalance({
      depositYen: PENALTY_YEN * 6,
      daysPastDeadline: 6,
      checkInCountPastDeadline: 0,
    });
    expect(result.balanceYen).toBe(0);
    expect(result.hasFailedEarly).toBe(true);
  });

  it("早期失敗した後は日数が増えても失敗回数と残高が変わらない", () => {
    const deposit = PENALTY_YEN * 6;
    const atEarlyFailure = calculateChallengeBalance({
      depositYen: deposit,
      daysPastDeadline: 6,
      checkInCountPastDeadline: 0,
    });
    const muchLater = calculateChallengeBalance({
      depositYen: deposit,
      daysPastDeadline: 30,
      checkInCountPastDeadline: 0,
    });
    expect(muchLater).toEqual(atEarlyFailure);
  });

  it("ペナルティ単価に満たない端数は残高に残る（返金対象にはしない）", () => {
    const remainder = 200;
    const result = calculateChallengeBalance({
      depositYen: PENALTY_YEN * 6 + remainder,
      daysPastDeadline: 30,
      checkInCountPastDeadline: 0,
    });
    expect(result).toEqual({
      failureCount: 6,
      balanceYen: remainder,
      hasFailedEarly: true,
    });
  });
});
