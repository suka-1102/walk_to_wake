import type { ChallengeBalance } from "@/lib/balance";
import { SYSTEM_FEE_PERCENT } from "@/lib/config";

/**
 * デポジット額に対するシステム利用料（円）。
 *
 * 円未満は切り捨てる。デポジット額を 500円 の倍数に限っていないため、料率をかけると端数が出る。
 * 率は百分率の整数で持ち、`0.03` のような小数を金額計算に持ち込まない。
 */
export const calculateSystemFeeYen = (depositYen: number): number =>
  Math.floor((depositYen * SYSTEM_FEE_PERCENT) / 100);

/**
 * 返金額（円）。期間満了まで続けた場合は残高をそのまま返し、早期失敗なら 0円。
 *
 * システム利用料は返金対象に含めない。早期失敗時にペナルティ単価へ満たず残った端数も返さない。
 *
 * 進行中のチャレンジに対して呼べば「このまま満了した場合の返金額」になる。
 * v1 では実際の返金は行わず、表示上の計算に留める。
 */
export const calculateRefundYen = (balance: ChallengeBalance): number =>
  balance.hasFailedEarly ? 0 : balance.balanceYen;
