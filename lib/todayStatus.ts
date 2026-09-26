import { isWithinCheckInWindow, type DeadlineTime } from "@/lib/checkInWindow";
import { startOfDay } from "@/lib/checkIn";
import { CHECK_IN_START_HOUR } from "@/lib/config";

/**
 * 進行中のチャレンジの、今日のチェックインの状況。ホームのバッジと案内文の出し分けに使う。
 *
 * - `checkedIn`: 今日はチェックイン済み
 * - `beforeStart`: 開始日より前
 * - `beforeWindow`: 受付開始時刻（`CHECK_IN_START_HOUR`）より前
 * - `open`: 受付時間内で、まだチェックインしていない
 * - `pastDeadline`: 期限を過ぎたのに、チェックインしていない（今日は失敗になる）
 */
export type TodayStatus = "checkedIn" | "beforeStart" | "beforeWindow" | "open" | "pastDeadline";

/**
 * 今日のチェックインの状況を返す。判定の順序は `judgeCheckIn` に揃えてある
 * （期間 → 受付時間）。済みかどうかは呼び出し側が DB から調べて渡す。
 */
export const judgeTodayStatus = (
  now: Date,
  challenge: { startDate: Date; deadline: DeadlineTime },
  checkedInToday: boolean
): TodayStatus => {
  if (checkedInToday) {
    return "checkedIn";
  }

  if (startOfDay(now) < startOfDay(challenge.startDate)) {
    return "beforeStart";
  }

  if (isWithinCheckInWindow(now, challenge.deadline)) {
    return "open";
  }

  return now.getHours() < CHECK_IN_START_HOUR ? "beforeWindow" : "pastDeadline";
};
