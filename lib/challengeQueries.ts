import { summarizeChallenge, type ChallengeSummary } from "@/lib/challengeSummary";
import { startOfDay } from "@/lib/checkIn";
import { lastDayPastDeadline } from "@/lib/deadlineDays";
import type { Challenge } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** DB から読んだチャレンジを、時刻 `now` の時点で集計する */
export async function summarizeStoredChallenge(
  challenge: Challenge,
  now: Date
): Promise<ChallengeSummary> {
  const deadline = { hour: challenge.deadlineHour, minute: challenge.deadlineMinute };

  // チェックイン成功日数は、すでに期限を過ぎた最終日までに揃えて数える
  // （当日分を含めると過去の失敗を打ち消して、失敗回数が少なく出る）
  const lastDay = lastDayPastDeadline(now, challenge.startDate, challenge.endDate, deadline);
  const checkInCountPastDeadline =
    lastDay === null
      ? 0
      : await prisma.checkIn.count({
          where: { challengeId: challenge.id, date: { lte: lastDay } },
        });

  return summarizeChallenge(
    now,
    {
      depositYen: challenge.depositYen,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      deadline,
    },
    checkInCountPastDeadline
  );
}

export type ActiveChallengeResult =
  | { status: "none" }
  /** 終了条件を満たしていたため、いま終了処理を行った。画面は詳細へ遷移させる */
  | { status: "ended"; challengeId: string }
  | {
      status: "active";
      challenge: Challenge;
      summary: ChallengeSummary;
      /** 今日はすでにチェックイン済みか */
      checkedInToday: boolean;
    };

/**
 * 進行中のチャレンジを、集計つきで返す。
 *
 * 失敗回数は動的に算出するため、誰も操作しなくても終了は起きない。そこで**アクセスされた時点で
 * 終了条件（期間満了 or 早期失敗）を判定し、満たしていれば `endedAt` を書いて進行中から外す**
 * （`activeUserId` を null に戻す）。書き込みは一度だけで、`endedAt` が null の行だけを対象にする。
 * 終了後は `getActiveChallenge` では見つからず、以後の集計は保存された値ではなく
 * `summarizeStoredChallenge` で毎回求める（終了済みでも結果は変わらない）。
 */
export async function getActiveChallenge(
  userId: string,
  now: Date
): Promise<ActiveChallengeResult> {
  const challenge = await prisma.challenge.findUnique({ where: { activeUserId: userId } });

  if (challenge === null) {
    return { status: "none" };
  }

  const summary = await summarizeStoredChallenge(challenge, now);

  if (summary.isFinished) {
    await prisma.challenge.updateMany({
      where: { id: challenge.id, endedAt: null },
      data: { endedAt: now, activeUserId: null },
    });
    return { status: "ended", challengeId: challenge.id };
  }

  const todayCheckIn = await prisma.checkIn.findUnique({
    where: { challengeId_date: { challengeId: challenge.id, date: startOfDay(now) } },
    select: { id: true },
  });

  return { status: "active", challenge, summary, checkedInToday: todayCheckIn !== null };
}
