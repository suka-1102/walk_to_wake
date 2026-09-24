import { CHECK_IN_START_HOUR, MAX_DEPOSIT_YEN, MIN_DEPOSIT_YEN } from "@/lib/config";

export type ChallengeInput = {
  deadlineHour: number;
  deadlineMinute: number;
  startDate: Date;
  endDate: Date;
  depositYen: number;
};

export type ChallengeInputError =
  | "deadlineOutOfRange"
  | "deadlineTooEarly"
  | "startDateNotFuture"
  | "endDateBeforeStart"
  | "depositOutOfRange";

export type ValidateChallengeInputResult =
  | { ok: true }
  | { ok: false; errors: ChallengeInputError[] };

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * チャレンジ作成の入力値を検証する。
 *
 * - 期限時刻は `CHECK_IN_START_HOUR` 以降でなければならない。それより前だと
 *   受付時間帯が存在せず、`isWithinCheckInWindow`（lib/checkInWindow.ts）が常に false を返してしまう
 * - 開始日は翌日以降のみ（当日は不可）。期限時刻を過ぎた後に作成された場合の
 *   初日の扱いという分岐を発生させないため（決定ログ 2026-09-18）
 * - チャレンジ期間の上限は設けない（決定ログ 2026-09-18）
 */
export const validateChallengeInput = (
  input: ChallengeInput,
  now: Date,
): ValidateChallengeInputResult => {
  const errors: ChallengeInputError[] = [];

  const hasValidTimeRange =
    Number.isInteger(input.deadlineHour) &&
    input.deadlineHour >= 0 &&
    input.deadlineHour <= 23 &&
    Number.isInteger(input.deadlineMinute) &&
    input.deadlineMinute >= 0 &&
    input.deadlineMinute <= 59;

  if (!hasValidTimeRange) {
    errors.push("deadlineOutOfRange");
  } else if (input.deadlineHour < CHECK_IN_START_HOUR) {
    errors.push("deadlineTooEarly");
  }

  const tomorrow = startOfDay(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (startOfDay(input.startDate) < tomorrow) {
    errors.push("startDateNotFuture");
  }

  if (startOfDay(input.endDate) < startOfDay(input.startDate)) {
    errors.push("endDateBeforeStart");
  }

  if (
    !Number.isInteger(input.depositYen) ||
    input.depositYen < MIN_DEPOSIT_YEN ||
    input.depositYen > MAX_DEPOSIT_YEN
  ) {
    errors.push("depositOutOfRange");
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
};
