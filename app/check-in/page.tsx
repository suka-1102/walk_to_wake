import type { Metadata } from "next";
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
      <h1 className={styles.title}>チェックイン</h1>

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
    </main>
  );
}
