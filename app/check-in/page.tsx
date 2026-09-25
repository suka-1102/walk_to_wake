import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CheckInPanel } from "./CheckInPanel";
import { getCheckInTarget } from "./queries";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "チェックイン | Walk to Wake",
};

const formatTime = (hour: number, minute: number): string =>
  `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

export default async function CheckInPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const target = await getCheckInTarget(session.user.id);

  return (
    <main className={styles.screen}>
      <div className={styles.header}>
        <Link href="/" className={styles.backButton} aria-label="戻る">
          <svg width="8" height="14" viewBox="0 0 8 14">
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
        <span className={styles.title}>チェックイン</span>
      </div>

      <div className={styles.body}>
        {target === null ? (
          <p className={styles.note}>ホームからチャレンジを作成してください</p>
        ) : (
          <>
            <div className={styles.card}>
              <div className={styles.row}>
                <span className={styles.rowLabel}>目標地点</span>
                <span className={styles.rowValue}>{target.locationName}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>期限</span>
                <span className={styles.rowValueMono}>
                  {formatTime(target.deadlineHour, target.deadlineMinute)}
                </span>
              </div>
            </div>

            <div className={styles.card}>
              {target.checkedInToday ? (
                <p className={styles.note}>今日はすでにチェックイン済みです</p>
              ) : (
                <CheckInPanel />
              )}
            </div>
          </>
        )}
      </div>

      <div className={styles.footer}>
        <Link href="/terms">利用規約</Link> ・ <Link href="/privacy">プライバシーポリシー</Link>
      </div>
    </main>
  );
}
