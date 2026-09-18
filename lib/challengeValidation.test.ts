import { describe, expect, it } from "vitest";
import { validateChallengeInput, type ChallengeInput } from "@/lib/challengeValidation";

// CHECK_IN_START_HOUR = 4、MIN_DEPOSIT_YEN = 3000、MAX_DEPOSIT_YEN = 30000 を前提にする。
const now = new Date(2026, 8, 18, 10, 0, 0);

const validInput: ChallengeInput = {
  deadlineHour: 7,
  deadlineMinute: 0,
  startDate: new Date(2026, 8, 19),
  endDate: new Date(2026, 8, 26),
  depositYen: 10000,
};

describe("validateChallengeInput", () => {
  it("すべて条件を満たせば ok", () => {
    expect(validateChallengeInput(validInput, now)).toEqual({ ok: true });
  });

  it("期限時刻が CHECK_IN_START_HOUR（4時）ちょうどなら ok", () => {
    const result = validateChallengeInput({ ...validInput, deadlineHour: 4 }, now);
    expect(result).toEqual({ ok: true });
  });

  it("期限時刻が CHECK_IN_START_HOUR より前（3時）なら deadlineTooEarly", () => {
    const result = validateChallengeInput({ ...validInput, deadlineHour: 3 }, now);
    expect(result).toEqual({ ok: false, errors: ["deadlineTooEarly"] });
  });

  it("時・分が範囲外なら deadlineOutOfRange", () => {
    const result = validateChallengeInput({ ...validInput, deadlineHour: 24 }, now);
    expect(result).toEqual({ ok: false, errors: ["deadlineOutOfRange"] });
  });

  it("開始日が翌日ちょうどなら ok", () => {
    const result = validateChallengeInput(
      { ...validInput, startDate: new Date(2026, 8, 19), endDate: new Date(2026, 8, 19) },
      now,
    );
    expect(result).toEqual({ ok: true });
  });

  it("開始日が当日なら startDateNotFuture", () => {
    const result = validateChallengeInput(
      { ...validInput, startDate: new Date(2026, 8, 18), endDate: new Date(2026, 8, 20) },
      now,
    );
    expect(result).toEqual({ ok: false, errors: ["startDateNotFuture"] });
  });

  it("終了日が開始日と同じ日（1日だけの期間）なら ok", () => {
    const result = validateChallengeInput(
      { ...validInput, startDate: new Date(2026, 8, 19), endDate: new Date(2026, 8, 19) },
      now,
    );
    expect(result).toEqual({ ok: true });
  });

  it("終了日が開始日より前なら endDateBeforeStart", () => {
    const result = validateChallengeInput(
      { ...validInput, startDate: new Date(2026, 8, 20), endDate: new Date(2026, 8, 19) },
      now,
    );
    expect(result).toEqual({ ok: false, errors: ["endDateBeforeStart"] });
  });

  it("期間の上限は設けない（100日でも ok）", () => {
    const result = validateChallengeInput(
      { ...validInput, startDate: new Date(2026, 8, 19), endDate: new Date(2026, 11, 27) },
      now,
    );
    expect(result).toEqual({ ok: true });
  });

  it("デポジット額が下限（3,000円）ちょうどなら ok", () => {
    const result = validateChallengeInput({ ...validInput, depositYen: 3000 }, now);
    expect(result).toEqual({ ok: true });
  });

  it("デポジット額が下限未満（2,999円）なら depositOutOfRange", () => {
    const result = validateChallengeInput({ ...validInput, depositYen: 2999 }, now);
    expect(result).toEqual({ ok: false, errors: ["depositOutOfRange"] });
  });

  it("デポジット額が上限（30,000円）ちょうどなら ok", () => {
    const result = validateChallengeInput({ ...validInput, depositYen: 30000 }, now);
    expect(result).toEqual({ ok: true });
  });

  it("デポジット額が上限超過（30,001円）なら depositOutOfRange", () => {
    const result = validateChallengeInput({ ...validInput, depositYen: 30001 }, now);
    expect(result).toEqual({ ok: false, errors: ["depositOutOfRange"] });
  });

  it("デポジット額が整数でなければ depositOutOfRange", () => {
    const result = validateChallengeInput({ ...validInput, depositYen: 3000.5 }, now);
    expect(result).toEqual({ ok: false, errors: ["depositOutOfRange"] });
  });

  it("複数の条件を同時に破ると、それぞれのエラーがまとめて返る", () => {
    const result = validateChallengeInput(
      {
        deadlineHour: 3,
        deadlineMinute: 0,
        startDate: new Date(2026, 8, 18),
        endDate: new Date(2026, 8, 17),
        depositYen: 100,
      },
      now,
    );
    expect(result).toEqual({
      ok: false,
      errors: [
        "deadlineTooEarly",
        "startDateNotFuture",
        "endDateBeforeStart",
        "depositOutOfRange",
      ],
    });
  });
});
