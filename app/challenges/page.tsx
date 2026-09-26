import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEndedChallenges } from "@/lib/challengeQueries";
import { formatDate, formatYen } from "@/lib/format";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "履歴 | Walk to Wake",
};

/**
 * 履歴。終了したチャレンジの一覧で、各行からチャレンジ詳細へ進む。
 * 進行中のチャレンジは出さない（ホームが扱う）。
 */
export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const endedChallenges = await getEndedChallenges(session.user.id, new Date());

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>履歴</h1>

      {endedChallenges.length === 0 ? (
        <p className={styles.empty}>まだ終了したチャレンジがありません</p>
      ) : (
        <ul className={styles.list}>
          {endedChallenges.map(({ challenge, summary, successCount }) => (
            <li key={challenge.id}>
              <Link href={`/challenges/${challenge.id}`} className={styles.row}>
                <div className={styles.rowHead}>
                  <span className={styles.name}>{challenge.locationName}</span>
                  <span
                    className={`${styles.badge} ${
                      summary.hasFailedEarly ? styles.badgeError : styles.badgeNeutral
                    }`}
                  >
                    {summary.hasFailedEarly ? "早期失敗" : "満了"}
                  </span>
                </div>
                <div className={styles.period}>
                  {formatDate(challenge.startDate)} 〜 {formatDate(challenge.endDate)}
                </div>
                <div className={styles.counts}>
                  <span className={styles.countLabel}>
                    成功 <span className={styles.success}>{successCount}</span>
                  </span>
                  <span className={styles.countLabel}>
                    失敗 <span className={styles.failure}>{summary.failureCount}</span>
                  </span>
                  <span className={`${styles.countLabel} ${styles.refund}`}>
                    返金 <span className={styles.refundValue}>¥{formatYen(summary.refundYen)}</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
