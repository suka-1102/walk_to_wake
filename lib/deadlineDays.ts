import type { DeadlineTime } from "@/lib/checkInWindow";

/** 指定した日の、指定した時刻ちょうどを表す `Date` を作る（時刻以外は day の日付を使う） */
const dateAt = (day: Date, time: DeadlineTime): Date =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), time.hour, time.minute, 0, 0);

/** 時刻を切り捨て、その日の 0 時にする */
const startOfDay = (date: Date): Date => dateAt(date, { hour: 0, minute: 0 });

/**
 * チャレンジ期間のうち、すでに期限時刻を過ぎた日数を返す。
 *
 * 開始日から数えて「期限時刻ちょうど、またはそれより後」を迎えた日を1日として数える。
 * 終了日より後は終了日までで頭打ちにする（期間が終われば、それ以上失敗も積み上がらない）。
 *
 * DB には成功したチェックインだけを保存し、失敗回数はこの値との差分で毎回計算する
 * （失敗を DB に持つと、誰も操作しなくても失敗を記録する仕組みが別途必要になるため）。
 */
export const countDaysPastDeadline = (
  now: Date,
  startDate: Date,
  endDate: Date,
  deadline: DeadlineTime
): number => {
  const lastDay = startOfDay(endDate);

  let count = 0;
  const cursor = startOfDay(startDate);

  while (cursor <= lastDay) {
    if (dateAt(cursor, deadline) > now) {
      break;
    }
    count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
};

/**
 * すでに期限時刻を過ぎた最終日（その日の 0 時）。1日も過ぎていなければ null。
 *
 * チェックイン成功日数を数える範囲をこの日までに揃えるために使う。範囲を揃えないと、
 * まだ期限が来ていない当日のチェックインが過去の失敗を打ち消し、失敗回数が1回少なくなる。
 */
export const lastDayPastDeadline = (
  now: Date,
  startDate: Date,
  endDate: Date,
  deadline: DeadlineTime
): Date | null => {
  const daysPastDeadline = countDaysPastDeadline(now, startDate, endDate, deadline);

  if (daysPastDeadline === 0) {
    return null;
  }

  const lastDay = startOfDay(startDate);
  lastDay.setDate(lastDay.getDate() + daysPastDeadline - 1);

  return lastDay;
};
