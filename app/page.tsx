import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { getActiveChallenge } from "@/lib/challengeQueries";
import { CHECK_IN_START_HOUR } from "@/lib/config";
import { formatTime, formatYen } from "@/lib/format";
import { judgeTodayStatus, type TodayStatus } from "@/lib/todayStatus";
import { DeadlineCountdown } from "./DeadlineCountdown";
import styles from "./page.module.scss";

const formatMonthDay = (date: Date): string => `${date.getMonth() + 1}/${date.getDate()}`;

/** 今日の状況ごとのバッジ文言と色 */
const STATUS_BADGES: Record<TodayStatus, { label: string; className: string }> = {
  open: { label: "受付中", className: styles.badgeSuccess },
  checkedIn: { label: "チェックイン済み", className: styles.badgeInfo },
  beforeStart: { label: "受付前", className: styles.badgeNeutral },
  beforeWindow: { label: "受付前", className: styles.badgeNeutral },
  pastDeadline: { label: "期限切れ", className: styles.badgeError },
};

/**
 * ホーム。進行中のチャレンジ1件の状態を出す。なければ作成の導線だけを出す。
 *
 * proxy.ts はセッションクッキーの有無しか見ないので、セッションが本当に生きているかは
 * ここで確かめる。以降のページも同じようにページ側で `auth()` を通す。
 *
 * チャレンジの終了は誰も操作しなくても起きないため、ここを表示した時点で判定する
 * （`getActiveChallenge`）。終了していたら詳細へ遷移させ、そこから次の作成へ進ませる。
 */
export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const now = new Date();
  const result = await getActiveChallenge(session.user.id, now);

  if (result.status === "ended") {
    redirect(`/challenges/${result.challengeId}`);
  }

  // ログアウトの正式な置き場はマイページ（6.6）。ここに置いているのはマイページができるまで
  // ログイン状態を切り替えて動作を確かめるための仮置き
  async function signOutFromHome() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  if (result.status === "none") {
    return (
      <main className={styles.screen}>
        <div className={styles.empty}>
          <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
            <circle cx="44" cy="44" r="44" fill="#eef2f6" />
            <path
              d="M44 22c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20z"
              fill="none"
              stroke="#9aa6b2"
              strokeWidth="2"
            />
            <path
              d="M44 34v8l6 6"
              fill="none"
              stroke="#9aa6b2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <h1 className={styles.emptyTitle}>進行中のチャレンジはありません</h1>
            <p className={styles.emptyText}>
              目標地点と期限時刻を決めて、
              <br />
              二度寝に効くデポジットを設定しましょう。
            </p>
          </div>
          <Link href="/challenges/new" className={styles.primaryButton}>
            チャレンジを作成
          </Link>
        </div>
      </main>
    );
  }

  const { challenge, summary, checkedInToday } = result;
  const deadline = { hour: challenge.deadlineHour, minute: challenge.deadlineMinute };
  const status = judgeTodayStatus(now, { startDate: challenge.startDate, deadline }, checkedInToday);
  const badge = STATUS_BADGES[status];

  // 進捗バーは、デポジット額に対する残高の割合（見た目だけ。金額の計算には使わない）
  const balancePercent = Math.round((summary.balanceYen / challenge.depositYen) * 100);

  const deadlineAt = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    deadline.hour,
    deadline.minute,
  );

  return (
    <main className={styles.screen}>
      <div className={styles.content}>
        <div>
          <div className={styles.eyebrow}>進行中のチャレンジ</div>
          <div className={styles.titleRow}>
            <h1 className={styles.challengeName}>{challenge.locationName}</h1>
            <span className={`${styles.badge} ${badge.className}`}>{badge.label}</span>
          </div>
        </div>

        <Link href={`/challenges/${challenge.id}`} className={styles.balanceCard}>
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
            <div>
              <div className={styles.statValue}>{formatTime(deadline.hour, deadline.minute)}</div>
              <div className={styles.statLabel}>期限時刻</div>
            </div>
          </div>
        </Link>

        {status === "open" && (
          <div className={`${styles.notice} ${styles.noticeWarning}`}>
            <span className={styles.noticeDot} />
            <span>
              本日はまだチェックインしていません。期限まで残り{" "}
              <span className={styles.noticeTime}>
                <DeadlineCountdown
                  deadlineAtMs={deadlineAt.getTime()}
                  renderedAtMs={now.getTime()}
                />
              </span>
            </span>
          </div>
        )}
        {status === "checkedIn" && (
          <div className={`${styles.notice} ${styles.noticeSuccess}`}>
            <span className={styles.noticeDot} />
            <span>本日のチェックインは完了しています。</span>
          </div>
        )}
        {status === "beforeStart" && (
          <div className={`${styles.notice} ${styles.noticeNeutral}`}>
            <span className={styles.noticeDot} />
            <span>チャレンジは {formatMonthDay(challenge.startDate)} から始まります。</span>
          </div>
        )}
        {status === "beforeWindow" && (
          <div className={`${styles.notice} ${styles.noticeNeutral}`}>
            <span className={styles.noticeDot} />
            <span>チェックインは {CHECK_IN_START_HOUR}:00 から受け付けます。</span>
          </div>
        )}
        {status === "pastDeadline" && (
          <div className={`${styles.notice} ${styles.noticeError}`}>
            <span className={styles.noticeDot} />
            <span>本日の期限を過ぎました。今日は失敗になります。</span>
          </div>
        )}

        <form action={signOutFromHome} className={styles.signOutForm}>
          <button type="submit" className={styles.signOutButton}>
            ログアウト
          </button>
        </form>
      </div>

      <div className={styles.action}>
        {status === "checkedIn" ? (
          <div className={styles.doneButton}>チェックイン済み</div>
        ) : (
          <Link href="/check-in" className={styles.primaryButton}>
            チェックインへ
          </Link>
        )}
      </div>
    </main>
  );
}
