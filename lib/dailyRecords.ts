import type { DeadlineTime } from "@/lib/checkInWindow";
import { PENALTY_YEN } from "@/lib/config";
import { formatDate } from "@/lib/format";

/** チャレンジ詳細の「日ごとの記録」の1行 */
export type DailyRecord = {
  /** その日の 0 時 */
  date: Date;
  result: "success" | "failure";
};

export type DailyRecordsInput = {
  depositYen: number;
  startDate: Date;
  endDate: Date;
  deadline: DeadlineTime;
};

/** 指定した日の、指定した時刻ちょうどを表す `Date` を作る */
const dateAt = (day: Date, time: DeadlineTime): Date =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), time.hour, time.minute, 0, 0);

/**
 * 日ごとの成功・失敗の記録を、新しい日が先頭になる順で返す。
 *
 * - 成功: その日にチェックインした日（期限前の今日を含む）
 * - 失敗: 期限を過ぎたのにチェックインしていない日
 * - まだ期限が来ていない日は、成功していなければ載せない（結果が出ていない）
 * - デポジットが吸収できる失敗回数に達したら、それより後の日は載せない
 *   （早期失敗で終了した後の日は失敗として数えない。`calculateChallengeBalance` と揃える）
 *
 * チェックインの日付は、DB の `@db.Date` を読んだ値をそのまま渡してよい。
 * 日付は `TIME_ZONE` 固定の前提で、ローカル日付（年月日）だけで突き合わせる。
 */
export const buildDailyRecords = (
  now: Date,
  challenge: DailyRecordsInput,
  checkInDates: Date[]
): DailyRecord[] => {
  const checkedInDays = new Set(checkInDates.map(formatDate));
  const maxFailureCount = Math.floor(challenge.depositYen / PENALTY_YEN);

  const records: DailyRecord[] = [];
  let failureCount = 0;

  const cursor = new Date(
    challenge.startDate.getFullYear(),
    challenge.startDate.getMonth(),
    challenge.startDate.getDate()
  );
  const lastDay = new Date(
    challenge.endDate.getFullYear(),
    challenge.endDate.getMonth(),
    challenge.endDate.getDate()
  );

  while (cursor <= lastDay) {
    const day = new Date(cursor);

    if (checkedInDays.has(formatDate(day))) {
      records.push({ date: day, result: "success" });
    } else if (dateAt(day, challenge.deadline) <= now) {
      records.push({ date: day, result: "failure" });
      failureCount += 1;

      if (failureCount >= maxFailureCount) {
        break;
      }
    } else {
      // この日の期限がまだ来ていない。以降の日も同じなので、ここで打ち切る
      break;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return records.reverse();
};
