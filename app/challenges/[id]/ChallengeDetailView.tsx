import Link from "next/link";
import type { ChallengeSummary } from "@/lib/challengeSummary";
import { PENALTY_YEN } from "@/lib/config";
import type { DailyRecord } from "@/lib/dailyRecords";
import { formatDate, formatTime, formatYen } from "@/lib/format";
import { DailyRecords } from "./DailyRecords";
import styles from "./page.module.scss";

type Props = {
  challenge: {
    locationName: string;
    startDate: Date;
    endDate: Date;
    deadlineHour: number;
    deadlineMinute: number;
    depositYen: number;
  };
  summary: ChallengeSummary;
  records: DailyRecord[];
  canCreateNext: boolean;
};

/**
 * チャレンジ詳細の表示部分。進行中と終了済みで共用する（screens.md）。
 * どちらも「集計」が中心で、違うのは終了済みに返金額とシステム利用料、次の作成への導線が加わる点だけ。
 * データを引かず受け取るだけにしてあるので、仮のデータでも描画できる。
 */
export function ChallengeDetailView({ challenge, summary, records, canCreateNext }: Props) {
  const badge = !summary.isFinished
    ? { label: "進行中", className: styles.badgeSuccess }
    : summary.hasFailedEarly
      ? { label: "早期失敗", className: styles.badgeError }
      : { label: "終了", className: styles.badgeNeutral };

  // 進捗バーは、デポジット額に対する残高の割合（見た目だけ。金額の計算には使わない）
  const balancePercent = Math.round((summary.balanceYen / challenge.depositYen) * 100);

  return (
    <main className={styles.screen}>
      <div className={styles.subHeader}>
        <Link
          href={summary.isFinished ? "/challenges" : "/"}
          className={styles.backButton}
          aria-label="戻る"
        >
          <svg width="8" height="14" viewBox="0 0 8 14" aria-hidden="true">
            <path
              d="M7 1L1 7l6 6"
              fill="none"
              stroke="#10192b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <span className={styles.subTitle}>チャレンジ詳細</span>
      </div>

      <div className={styles.content}>
        <div className={styles.titleBlock}>
          <div className={styles.titleRow}>
            <h1 className={styles.challengeName}>{challenge.locationName}</h1>
            <span className={`${styles.badge} ${badge.className}`}>{badge.label}</span>
          </div>
          <div className={styles.meta}>
            {formatDate(challenge.startDate)} 〜 {formatDate(challenge.endDate)} ・ 期限{" "}
            {formatTime(challenge.deadlineHour, challenge.deadlineMinute)}
          </div>
        </div>

        <div className={styles.balanceCard}>
          <div className={styles.balanceLabel}>デポジット残高</div>
          <div className={styles.balanceValue}>
            ¥{formatYen(summary.balanceYen)}
            <span className={styles.balanceTotal}> / {formatYen(challenge.depositYen)}</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressBar} style={{ width: `${balancePercent}%` }} />
          </div>
          <div className={styles.stats}>
            <div>
              <div className={styles.statValue}>{summary.failureCount}</div>
              <div className={styles.statLabel}>失敗回数</div>
            </div>
            <div>
              <div className={styles.statValue}>{summary.remainingDays}</div>
              <div className={styles.statLabel}>残り日数</div>
            </div>
          </div>
        </div>

        <DailyRecords records={records} />

        {summary.isFinished && (
          <section className={styles.resultCard}>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>返金額</span>
              <span className={styles.resultValue}>¥{formatYen(summary.refundYen)}</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>
                システム利用料<span className={styles.resultTag}>返金対象外</span>
              </span>
              <span className={styles.resultValueSub}>¥{formatYen(summary.systemFeeYen)}</span>
            </div>
            <p className={styles.resultNote}>
              {summary.hasFailedEarly
                ? `残高がペナルティ単価（¥${formatYen(PENALTY_YEN)}）を下回ったため、途中で終了しました。${
                    summary.balanceYen > 0
                      ? `残りの ¥${formatYen(summary.balanceYen)} は返金されません。`
                      : ""
                  }`
                : "期間を満了しました。残高がそのまま返金額になります。"}
              表示上の計算で、実際の返金は行われません。
            </p>
          </section>
        )}

        {summary.isFinished && canCreateNext && (
          <Link href="/challenges/new" className={styles.primaryButton}>
            次のチャレンジを作成
          </Link>
        )}
      </div>
    </main>
  );
}
