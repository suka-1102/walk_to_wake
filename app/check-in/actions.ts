"use server";

import { auth } from "@/lib/auth";
import { calculateChallengeBalance } from "@/lib/balance";
import { judgeCheckIn, startOfDay, type CheckInPosition, type CheckInRejection } from "@/lib/checkIn";
import { countDaysPastDeadline, lastDayPastDeadline } from "@/lib/deadlineDays";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

/**
 * チェックインが成立しなかった理由。距離・時刻・精度に由来するもの（`CheckInRejection`）に、
 * リクエスト側の事情を足している。
 *
 * - `unauthenticated`: 未ログイン
 * - `invalidInput`: 座標・精度が有限の数値ではない
 * - `noActiveChallenge`: 進行中のチャレンジがない
 * - `failedEarly`: 残高がペナルティ単価を下回り、チャレンジが早期失敗で終了している
 * - `alreadyCheckedIn`: 今日はすでにチェックイン済み（1日1回）
 */
export type CheckInError =
  | CheckInRejection
  | { reason: "unauthenticated" }
  | { reason: "invalidInput" }
  | { reason: "noActiveChallenge" }
  | { reason: "failedEarly" }
  | { reason: "alreadyCheckedIn" };

export type CheckInResult = { ok: true } | ({ ok: false } & CheckInError);

/**
 * 進行中のチャレンジにチェックインを記録する。
 *
 * **判定はすべてここ（サーバー）で行う。** クライアントからは現在地と accuracy だけを受け取り、
 * 時刻はサーバーの `new Date()` を使う（端末の時計をずらして期限を回避されないため）。
 * 受け取った現在地と accuracy は判定にのみ使い、保存しない（プライバシーポリシー）。
 * 保存するのは成立したチェックインの日付だけ。
 *
 * 1日1回の制限は `CheckIn` の `(challengeId, date)` 一意制約が担保する。判定の前に確認して
 * `alreadyCheckedIn` を返す（済みの人に位置の不備を伝えても意味がないため）が、確認と保存の間に
 * 同時リクエストが割り込む場合は一意制約違反（P2002）を捕まえて同じ結果にする。
 */
export async function checkIn(position: CheckInPosition): Promise<CheckInResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, reason: "unauthenticated" };
  }

  // Server Action の引数は型を信用できない。NaN・Infinity・文字列などを弾く
  if (
    !Number.isFinite(position.latitude) ||
    !Number.isFinite(position.longitude) ||
    !Number.isFinite(position.accuracy)
  ) {
    return { ok: false, reason: "invalidInput" };
  }

  const challenge = await prisma.challenge.findUnique({
    where: { activeUserId: session.user.id },
  });

  if (challenge === null) {
    return { ok: false, reason: "noActiveChallenge" };
  }

  const now = new Date();
  const deadline = { hour: challenge.deadlineHour, minute: challenge.deadlineMinute };

  // 早期失敗で終わっているチャレンジには、期間内でもチェックインさせない。
  // 数える範囲は「すでに期限を過ぎた最終日」までに揃える（当日分を含めると過去の失敗を打ち消す）
  const daysPastDeadline = countDaysPastDeadline(
    now,
    challenge.startDate,
    challenge.endDate,
    deadline
  );
  const lastDay = lastDayPastDeadline(now, challenge.startDate, challenge.endDate, deadline);
  const checkInCountPastDeadline =
    lastDay === null
      ? 0
      : await prisma.checkIn.count({
          where: { challengeId: challenge.id, date: { lte: lastDay } },
        });

  const { hasFailedEarly } = calculateChallengeBalance({
    depositYen: challenge.depositYen,
    daysPastDeadline,
    checkInCountPastDeadline,
  });

  if (hasFailedEarly) {
    return { ok: false, reason: "failedEarly" };
  }

  const today = startOfDay(now);
  const existing = await prisma.checkIn.findUnique({
    where: { challengeId_date: { challengeId: challenge.id, date: today } },
    select: { id: true },
  });

  if (existing !== null) {
    return { ok: false, reason: "alreadyCheckedIn" };
  }

  const judgement = judgeCheckIn(now, position, {
    target: { latitude: challenge.latitude, longitude: challenge.longitude },
    deadline,
    startDate: challenge.startDate,
    endDate: challenge.endDate,
  });

  if (!judgement.ok) {
    return judgement;
  }

  try {
    await prisma.checkIn.create({
      data: { challengeId: challenge.id, date: today },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, reason: "alreadyCheckedIn" };
    }
    throw error;
  }

  return { ok: true };
}
