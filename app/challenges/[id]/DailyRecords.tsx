import type { DailyRecord } from "@/lib/dailyRecords";
import { formatMonthDayWeekday } from "@/lib/format";
import styles from "./DailyRecords.module.scss";

/** チャレンジ詳細の「日ごとの記録」。成功は黄色の丸、失敗は欠けた月で示す（画面モックの ChallengeDetail） */
export function DailyRecords({ records }: { records: DailyRecord[] }) {
  return (
    <section>
      <h2 className={styles.sectionTitle}>日ごとの記録</h2>
      {records.length === 0 ? (
        <p className={styles.empty}>まだ記録がありません</p>
      ) : (
        <ul className={styles.records}>
          {records.map((record) => (
            <li key={record.date.getTime()} className={styles.record}>
              {record.result === "success" ? (
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="10" fill="#ffcb3d" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="9" fill="#c5cdd6" />
                  <circle cx="13.5" cy="7" r="7.5" fill="#ffffff" />
                </svg>
              )}
              <span className={styles.date}>{formatMonthDayWeekday(record.date)}</span>
              <span className={record.result === "success" ? styles.success : styles.failure}>
                {record.result === "success" ? "成功" : "失敗"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
