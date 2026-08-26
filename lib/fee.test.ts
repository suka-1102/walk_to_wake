import { describe, expect, it } from "vitest";
import { calculateRefundYen, calculateSystemFeeYen } from "@/lib/fee";
import { calculateChallengeBalance } from "@/lib/balance";

// 期待値は SYSTEM_FEE_PERCENT = 3、PENALTY_YEN = 500 を前提に実際の金額で書く。
// 料率やペナルティ単価を変えたらこのファイルも見直す。

describe("calculateSystemFeeYen", () => {
  it("デポジット額の下限（3,000円）なら 90円", () => {
    expect(calculateSystemFeeYen(3000)).toBe(90);
  });

  it("10,000円 なら 300円", () => {
    expect(calculateSystemFeeYen(10000)).toBe(300);
  });

  it("デポジット額の上限（30,000円）なら 900円", () => {
    expect(calculateSystemFeeYen(30000)).toBe(900);
  });

  it("円未満の端数は切り捨てる（3,499円 なら 104.97円 → 104円）", () => {
    expect(calculateSystemFeeYen(3499)).toBe(104);
  });

  it("切り捨てた結果でも整数を返す", () => {
    expect(Number.isInteger(calculateSystemFeeYen(3333))).toBe(true);
  });
});

describe("calculateRefundYen", () => {
  it("失敗が1回もなければデポジット額の全額を返金する", () => {
    const balance = calculateChallengeBalance({
      depositYen: 3000,
      daysPastDeadline: 10,
      successfulCheckInCount: 10,
    });
    expect(calculateRefundYen(balance)).toBe(3000);
  });

  it("満了まで続けた場合は「デポジット額 − 失敗回数 × ペナルティ単価」を返金する", () => {
    const balance = calculateChallengeBalance({
      depositYen: 10000,
      daysPastDeadline: 10,
      successfulCheckInCount: 7,
    });
    expect(calculateRefundYen(balance)).toBe(10000 - 500 * 3);
  });

  it("残高がペナルティ単価ちょうどまで減っていても、早期失敗でなければ返金する", () => {
    const balance = calculateChallengeBalance({
      depositYen: 3000,
      daysPastDeadline: 5,
      successfulCheckInCount: 0,
    });
    expect(balance.hasFailedEarly).toBe(false);
    expect(calculateRefundYen(balance)).toBe(500);
  });

  it("早期失敗なら 0円", () => {
    const balance = calculateChallengeBalance({
      depositYen: 3000,
      daysPastDeadline: 6,
      successfulCheckInCount: 0,
    });
    expect(balance.hasFailedEarly).toBe(true);
    expect(calculateRefundYen(balance)).toBe(0);
  });

  it("早期失敗時にペナルティ単価へ満たず残った端数も返金しない", () => {
    const balance = calculateChallengeBalance({
      depositYen: 3200,
      daysPastDeadline: 30,
      successfulCheckInCount: 0,
    });
    expect(balance.balanceYen).toBe(200);
    expect(calculateRefundYen(balance)).toBe(0);
  });
});
