/**
 * しきい値・定数の集約先。仕様の数値はこのファイルが正で、AGENTS.md には理由だけを残す。
 * 金額はすべて円単位の整数で扱い、浮動小数点を持ち込まない。
 */

/** チェックインを成立とみなす、目標地点からの距離（メートル） */
export const CHECK_IN_RADIUS_METERS = 100;

/** 採用してよい位置精度の上限（メートル）。Geolocation の accuracy がこれを超える座標は使わない */
export const MAX_ACCURACY_METERS = 50;

/** チェックインの受付を開始する時刻（JST の時） */
export const CHECK_IN_START_HOUR = 4;

/** 1失敗あたりの減額（円） */
export const PENALTY_YEN = 500;

/** デポジット額の下限（円） */
export const MIN_DEPOSIT_YEN = 3000;

/** デポジット額の上限（円） */
export const MAX_DEPOSIT_YEN = 30000;

/** システム利用料の料率（パーセント）。円の整数計算に載せるため、率ではなく百分率で持つ */
export const SYSTEM_FEE_PERCENT = 3;

/** 1ユーザーが同時に持てるチャレンジ数 */
export const MAX_ACTIVE_CHALLENGES = 1;

/** タイムゾーン。サーバー・DB とも固定で、変換ロジックは持たない */
export const TIME_ZONE = "Asia/Tokyo";
