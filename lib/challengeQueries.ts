import { summarizeChallenge, type ChallengeSummary } from "@/lib/challengeSummary";
import { buildDailyRecords, type DailyRecord } from "@/lib/dailyRecords";
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

/**
 * 終了条件を満たしているのに未処理のチャレンジを、終了済みにする（`endedAt` を書いて進行中から外す）。
 * 書き込みは一度だけで、`endedAt` が null の行だけを対象にする。
 */
async function endChallengeIfFinished(
  challenge: Challenge,
  summary: ChallengeSummary,
  now: Date
): Promise<void> {
  if (!summary.isFinished || challenge.endedAt !== null) {
    return;
  }

  await prisma.challenge.updateMany({
    where: { id: challenge.id, endedAt: null },
    data: { endedAt: now, activeUserId: null },
  });
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
    await endChallengeIfFinished(challenge, summary, now);
    return { status: "ended", challengeId: challenge.id };
  }

  const todayCheckIn = await prisma.checkIn.findUnique({
    where: { challengeId_date: { challengeId: challenge.id, date: startOfDay(now) } },
    select: { id: true },
  });

  return { status: "active", challenge, summary, checkedInToday: todayCheckIn !== null };
}

export type ChallengeDetail = {
  challenge: Challenge;
  summary: ChallengeSummary;
  /** 日ごとの成功・失敗の記録（新しい日が先頭） */
  records: DailyRecord[];
  /** 今、新しいチャレンジを作れるか（進行中のチャレンジを持っていない） */
  canCreateNext: boolean;
};

/**
 * チャレンジ詳細に出す情報。進行中・終了済みを問わず `id` で引く。
 *
 * 他のユーザーのチャレンジは見せない（`userId` も条件に含め、見つからないものとして扱う）。
 * ホームを経由せず URL から直接開かれても終了処理が抜けないよう、ここでも終了条件を判定する。
 * 終了済みかどうかは保存した `endedAt` ではなく、集計（`summary.isFinished`）で決める。
 */
export async function getChallengeDetail(
  userId: string,
  challengeId: string,
  now: Date
): Promise<ChallengeDetail | null> {
  const challenge = await prisma.challenge.findFirst({ where: { id: challengeId, userId } });

  if (challenge === null) {
    return null;
  }

  const summary = await summarizeStoredChallenge(challenge, now);
  await endChallengeIfFinished(challenge, summary, now);

  const active = await prisma.challenge.findUnique({
    where: { activeUserId: userId },
    select: { id: true },
  });

  const checkIns = await prisma.checkIn.findMany({
    where: { challengeId: challenge.id },
    select: { date: true },
  });
  const records = buildDailyRecords(
    now,
    {
      depositYen: challenge.depositYen,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      deadline: { hour: challenge.deadlineHour, minute: challenge.deadlineMinute },
    },
    checkIns.map((checkIn) => checkIn.date)
  );

  return { challenge, summary, records, canCreateNext: active === null };
}

export type EndedChallenge = {
  challenge: Challenge;
  summary: ChallengeSummary;
  /** 成功した日数（日ごとの記録の成功の数） */
  successCount: number;
};

/**
 * 終了したチャレンジの一覧（開始日が新しい順）。履歴に出す。
 *
 * 集計は保存した値ではなく毎回求める（終了済みでも結果は変わらない）。
 * 進行中のチャレンジは含めない。終了処理（`endedAt` の書き込み）は、ホームか詳細を開いたときに行われる。
 */
export async function getEndedChallenges(userId: string, now: Date): Promise<EndedChallenge[]> {
  const challenges = await prisma.challenge.findMany({
    where: { userId, endedAt: { not: null } },
    orderBy: { startDate: "desc" },
    include: { checkIns: { select: { date: true } } },
  });

  return Promise.all(
    challenges.map(async ({ checkIns, ...challenge }) => {
      const summary = await summarizeStoredChallenge(challenge, now);
      const records = buildDailyRecords(
        now,
        {
          depositYen: challenge.depositYen,
          startDate: challenge.startDate,
          endDate: challenge.endDate,
          deadline: { hour: challenge.deadlineHour, minute: challenge.deadlineMinute },
        },
        checkIns.map((checkIn) => checkIn.date)
      );

      return {
        challenge,
        summary,
        successCount: records.filter((record) => record.result === "success").length,
      };
    })
  );
}
