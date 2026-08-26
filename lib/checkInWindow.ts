import { CHECK_IN_START_HOUR } from "@/lib/config";

/** チェックイン期限の時刻。チャレンジ作成時に決めて以後は変えない */
export type DeadlineTime = {
  hour: number;
  minute: number;
};

const MILLISECONDS_PER_MINUTE = 60 * 1000;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;

/**
 * その日の 0 時からの経過ミリ秒。
 * `TIME_ZONE` 固定の前提で実行環境のローカル時刻をそのまま読む（変換ロジックは持たない）。
 */
const millisecondsOfDay = (date: Date): number =>
  date.getHours() * MILLISECONDS_PER_HOUR +
  date.getMinutes() * MILLISECONDS_PER_MINUTE +
  date.getSeconds() * 1000 +
  date.getMilliseconds();

/**
 * チェックインを受け付けてよい時間帯かどうか。
 *
 * 受付は当日の `CHECK_IN_START_HOUR` 時ちょうどから期限時刻ちょうどまで。前夜のうちに
 * 済ませられないよう開始時刻で切り、期限に猶予は置かない（1ミリ秒でも過ぎたら受け付けない）。
 *
 * 期限時刻が `CHECK_IN_START_HOUR` より前なら受付時間は存在せず、常に false を返す。
 * その組み合わせを作らせないのは入力値の検証側の責務。
 */
export const isWithinCheckInWindow = (now: Date, deadline: DeadlineTime): boolean => {
  const current = millisecondsOfDay(now);
  const start = CHECK_IN_START_HOUR * MILLISECONDS_PER_HOUR;
  const end = deadline.hour * MILLISECONDS_PER_HOUR + deadline.minute * MILLISECONDS_PER_MINUTE;

  return current >= start && current <= end;
};
