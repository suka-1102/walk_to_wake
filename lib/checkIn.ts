import { isWithinCheckInWindow, type DeadlineTime } from "@/lib/checkInWindow";
import { CHECK_IN_START_HOUR, MAX_ACCURACY_METERS } from "@/lib/config";
import { calculateDistanceMeters, isWithinCheckInRadius, type Coordinates } from "@/lib/distance";

/** クライアントから受け取る現在地。判定にだけ使い、保存しない */
export type CheckInPosition = Coordinates & {
  /** Geolocation が返す誤差半径（メートル） */
  accuracy: number;
};

/** 判定に必要なチャレンジの条件 */
export type CheckInChallenge = {
  target: Coordinates;
  deadline: DeadlineTime;
  startDate: Date;
  endDate: Date;
};

/**
 * チェックインが成立しなかった理由。画面側はこれで分岐して文言を出す。
 *
 * - `beforeStart` / `afterEnd`: 今日がチャレンジ期間の外
 * - `beforeWindow`: 受付開始時刻（`CHECK_IN_START_HOUR`）より前
 * - `pastDeadline`: 期限時刻を過ぎた
 * - `accuracyTooLow`: 位置精度が `MAX_ACCURACY_METERS` を超えている。再取得を促す
 * - `outOfRange`: 目標地点から判定半径より離れている
 */
export type CheckInRejection =
  | { reason: "beforeStart" }
  | { reason: "afterEnd" }
  | { reason: "beforeWindow" }
  | { reason: "pastDeadline" }
  | { reason: "accuracyTooLow"; accuracyMeters: number }
  | { reason: "outOfRange"; distanceMeters: number };

export type CheckInJudgement = { ok: true } | ({ ok: false } & CheckInRejection);

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * チェックインの成立判定。サーバー側で、サーバーの現在時刻を渡して呼ぶ
 * （クライアント時刻を信じると端末の時計をずらすだけで期限を回避できるため）。
 *
 * 時刻 → 位置精度 → 距離の順に調べ、最初に引っかかった理由を返す。時刻で弾けるなら
 * 位置の良し悪しを伝えても意味がなく、精度が足りない座標で距離を出しても当てにならないため。
 *
 * 1日1回の制限と、チャレンジが終了済みかどうかはここでは見ない（呼び出し側の責務）。
 */
export const judgeCheckIn = (
  now: Date,
  position: CheckInPosition,
  challenge: CheckInChallenge
): CheckInJudgement => {
  const today = startOfDay(now);

  if (today < startOfDay(challenge.startDate)) {
    return { ok: false, reason: "beforeStart" };
  }

  if (today > startOfDay(challenge.endDate)) {
    return { ok: false, reason: "afterEnd" };
  }

  if (!isWithinCheckInWindow(now, challenge.deadline)) {
    return now.getHours() < CHECK_IN_START_HOUR
      ? { ok: false, reason: "beforeWindow" }
      : { ok: false, reason: "pastDeadline" };
  }

  // `accuracy > MAX` と書かないのは、NaN が届いたときに素通りさせないため
  if (!(position.accuracy <= MAX_ACCURACY_METERS)) {
    return { ok: false, reason: "accuracyTooLow", accuracyMeters: position.accuracy };
  }

  if (!isWithinCheckInRadius(position, challenge.target)) {
    return {
      ok: false,
      reason: "outOfRange",
      distanceMeters: calculateDistanceMeters(position, challenge.target),
    };
  }

  return { ok: true };
};
