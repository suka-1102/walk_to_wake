import { PENALTY_YEN } from "@/lib/config";

/** 失敗回数と残高。早期失敗で終了した後は、いずれもその時点の値で止まる */
export type ChallengeBalance = {
  /** 残高に反映された失敗回数 */
  failureCount: number;
  /** 残高（円） */
  balanceYen: number;
  /** 残高がペナルティ単価を下回り、チャレンジが即時終了した状態か */
  hasFailedEarly: boolean;
};

/** `calculateChallengeBalance` の入力。同じ型の数値が並ぶため、順番の取り違えを避けて名前で受け取る */
export type ChallengeBalanceInput = {
  /** ユーザーが設定したデポジット額（円） */
  depositYen: number;
  /** すでに期限時刻を過ぎた日数（`countDaysPastDeadline`） */
  daysPastDeadline: number;
  /** 期限をすでに過ぎた日のうち、チェックインに成功した日数（`lastDayPastDeadline` 以前に限る） */
  checkInCountPastDeadline: number;
};

/**
 * 期限を過ぎた日数とチェックイン成功日数から失敗回数を出す。
 *
 * DB に保存するのは成功したチェックインだけなので、失敗はこの差分として毎回求める。
 *
 * **両辺で数える範囲を揃えること。** 成功日数に「まだ期限が来ていない当日」の
 * チェックインを含めると、それが過去の失敗を1回打ち消して失敗回数が少なく出る。
 * 数える範囲は `lastDayPastDeadline` が返す日までに限る。
 *
 * 範囲さえ揃っていれば成功日数が期限を過ぎた日数を上回ることはないが、
 * 呼び出し側の取り違えが金額の誤りとして表に出ないよう 0 で下げ止める。
 */
export const countFailures = (
  daysPastDeadline: number,
  checkInCountPastDeadline: number
): number => Math.max(0, daysPastDeadline - checkInCountPastDeadline);

/**
 * 失敗回数と残高を求める。
 *
 * 残高がペナルティ単価を下回った時点でチャレンジは即時終了するため、それ以降の日は
 * 失敗として数えない。デポジットが吸収できるペナルティの回数が、そのまま失敗回数の上限になる。
 * ペナルティ単価に満たない端数は残高に残るが、返金対象にはならない。
 */
export const calculateChallengeBalance = ({
  depositYen,
  daysPastDeadline,
  checkInCountPastDeadline,
}: ChallengeBalanceInput): ChallengeBalance => {
  const maxFailureCount = Math.floor(depositYen / PENALTY_YEN);
  const failureCount = Math.min(
    countFailures(daysPastDeadline, checkInCountPastDeadline),
    maxFailureCount
  );
  const balanceYen = depositYen - failureCount * PENALTY_YEN;

  return {
    failureCount,
    balanceYen,
    hasFailedEarly: balanceYen < PENALTY_YEN,
  };
};
