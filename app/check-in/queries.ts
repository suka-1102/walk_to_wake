import { startOfDay } from "@/lib/checkIn";
import { prisma } from "@/lib/prisma";

export type CheckInTarget = {
  locationName: string;
  deadlineHour: number;
  deadlineMinute: number;
  /** 今日はすでにチェックイン済みか。表示の出し分け用で、最終的な判定は `checkIn` が行う */
  checkedInToday: boolean;
};

/** チェックイン画面に出す、進行中のチャレンジの情報。進行中がなければ null */
export async function getCheckInTarget(userId: string): Promise<CheckInTarget | null> {
  const challenge = await prisma.challenge.findUnique({
    where: { activeUserId: userId },
    select: {
      locationName: true,
      deadlineHour: true,
      deadlineMinute: true,
      checkIns: { where: { date: startOfDay(new Date()) }, select: { id: true } },
    },
  });

  if (challenge === null) {
    return null;
  }

  return {
    locationName: challenge.locationName,
    deadlineHour: challenge.deadlineHour,
    deadlineMinute: challenge.deadlineMinute,
    checkedInToday: challenge.checkIns.length > 0,
  };
}
