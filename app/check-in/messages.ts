import { CHECK_IN_RADIUS_METERS, CHECK_IN_START_HOUR, MAX_ACCURACY_METERS } from "@/lib/config";
import type { CheckInError } from "./actions";

/** サーバーへ届かなかった場合など、クライアント側で起きる失敗を足した理由 */
export type CheckInFailure = CheckInError | { reason: "requestFailed" };

/** 位置を取り直せば結果が変わりうる理由か。それ以外は再取得しても同じ結果になる */
export const isRetryable = (failure: CheckInFailure): boolean =>
  failure.reason === "outOfRange" ||
  failure.reason === "accuracyTooLow" ||
  failure.reason === "invalidInput" ||
  failure.reason === "requestFailed";

/** チェックインが成立しなかった理由を、画面に出す文言にする */
export const describeCheckInFailure = (failure: CheckInFailure): string => {
  switch (failure.reason) {
    case "beforeStart":
      return "チャレンジはまだ始まっていません。";
    case "afterEnd":
      return "チャレンジ期間は終了しています。";
    case "beforeWindow":
      return `チェックインは ${CHECK_IN_START_HOUR}:00 から受け付けます。`;
    case "pastDeadline":
      return "期限を過ぎたため、今日はチェックインできません。";
    case "accuracyTooLow":
      return `精度が不十分です（約${Math.round(failure.accuracyMeters)}m、必要なのは ${MAX_ACCURACY_METERS}m 以内）。空の見える場所で再取得してください。`;
    case "outOfRange":
      return `目標地点まで約${Math.round(failure.distanceMeters)}m あります。${CHECK_IN_RADIUS_METERS}m 以内まで近づいてください。`;
    case "alreadyCheckedIn":
      return "今日はすでにチェックイン済みです。";
    case "failedEarly":
      return "残高がペナルティ単価を下回ったため、チャレンジは終了しています。";
    case "noActiveChallenge":
      return "進行中のチャレンジがありません。";
    case "unauthenticated":
      return "ログインが必要です。";
    case "invalidInput":
      return "位置情報を正しく取得できませんでした。もう一度取得してください。";
    case "requestFailed":
      return "通信に失敗しました。電波の良い場所でもう一度お試しください。";
  }
};
