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
  /** すでに期限時刻を過ぎた日数 */
  daysPastDeadline: number;
  /** 成立したチェックインの日数 */
  successfulCheckInCount: number;
};

/**
 * 期限を過ぎた日数とチェックイン成功日数から失敗回数を出す。
 *
 * DB に保存するのは成功したチェックインだけなので、失敗はこの差分として毎回求める。
 * 当日の期限前にチェックインを済ませた場合は成功日数のほうが多くなるため、0 で下げ止める。
 */
export const countFailures = (daysPastDeadline: number, successfulCheckInCount: number): number =>
  Math.max(0, daysPastDeadline - successfulCheckInCount);

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
  successfulCheckInCount,
}: ChallengeBalanceInput): ChallengeBalance => {
  const maxFailureCount = Math.floor(depositYen / PENALTY_YEN);
  const failureCount = Math.min(
    countFailures(daysPastDeadline, successfulCheckInCount),
    maxFailureCount
  );
  const balanceYen = depositYen - failureCount * PENALTY_YEN;

  return {
    failureCount,
    balanceYen,
    hasFailedEarly: balanceYen < PENALTY_YEN,
  };
};
