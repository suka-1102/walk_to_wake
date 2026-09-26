import { calculateChallengeBalance, type ChallengeBalance } from "@/lib/balance";
import type { DeadlineTime } from "@/lib/checkInWindow";
import { countDaysPastDeadline } from "@/lib/deadlineDays";
import { calculateRefundYen, calculateSystemFeeYen } from "@/lib/fee";

/** 集計に必要なチャレンジの条件 */
export type ChallengeSummaryInput = {
  depositYen: number;
  startDate: Date;
  endDate: Date;
  deadline: DeadlineTime;
};

export type ChallengeSummary = ChallengeBalance & {
  /** 期間の日数（開始日と終了日を含む） */
  totalDays: number;
  /** すでに期限時刻を過ぎた日数 */
  daysPastDeadline: number;
  /** まだ期限が来ていない日数（期限前の今日を含む）。終了済みなら 0 */
  remainingDays: number;
  /** 終了日の期限時刻を過ぎ、期間を満了した状態か */
  isPeriodOver: boolean;
  /** 期間満了か早期失敗のどちらかで、チャレンジが終了している状態か */
  isFinished: boolean;
  /** このまま終えた場合（終了済みなら確定した）返金額（円）。表示上の計算 */
  refundYen: number;
  /** システム利用料（円）。返金対象外 */
  systemFeeYen: number;
};

/** 開始日から終了日までの日数（両端を含む）。夏時間などで 24 時間にならない日があっても数え間違えない */
const countDaysInclusive = (startDate: Date, endDate: Date): number => {
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const last = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  let count = 0;
  while (cursor <= last) {
    count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
};

/**
 * チャレンジの集計。ホーム・チャレンジ詳細・チェックインの受付可否がこの1つの結果を見る。
 *
 * `checkInCountPastDeadline` は「すでに期限を過ぎた最終日（`lastDayPastDeadline`）までの
 * チェックイン成功日数」。当日分を含めると過去の失敗を打ち消すため、数える範囲は呼び出し側で
 * 揃える（→ `countFailures`）。
 *
 * 終了済みのチャレンジに、あとから呼んでも結果は変わらない。日数は終了日で、失敗回数は
 * デポジットが吸収できる回数で頭打ちになるため。
 */
export const summarizeChallenge = (
  now: Date,
  challenge: ChallengeSummaryInput,
  checkInCountPastDeadline: number
): ChallengeSummary => {
  const totalDays = countDaysInclusive(challenge.startDate, challenge.endDate);
  const daysPastDeadline = countDaysPastDeadline(
    now,
    challenge.startDate,
    challenge.endDate,
    challenge.deadline
  );

  const balance = calculateChallengeBalance({
    depositYen: challenge.depositYen,
    daysPastDeadline,
    checkInCountPastDeadline,
  });

  const isPeriodOver = daysPastDeadline >= totalDays;
  const isFinished = isPeriodOver || balance.hasFailedEarly;

  return {
    ...balance,
    totalDays,
    daysPastDeadline,
    remainingDays: isFinished ? 0 : totalDays - daysPastDeadline,
    isPeriodOver,
    isFinished,
    refundYen: calculateRefundYen(balance),
    systemFeeYen: calculateSystemFeeYen(challenge.depositYen),
  };
};
