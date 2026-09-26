/** 金額（円）を桁区切りで表す。金額は整数の円で扱うので小数は出さない */
export const formatYen = (yen: number): string => yen.toLocaleString("ja-JP");

/** 時刻を `HH:MM` で表す */
export const formatTime = (hour: number, minute: number): string =>
  `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

/** 日付を `YYYY-MM-DD` で表す。`TIME_ZONE` 固定の前提で実行環境のローカル日付をそのまま読む */
export const formatDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
