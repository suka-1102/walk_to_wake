import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import {
  CHECK_IN_START_HOUR,
  MAX_DEPOSIT_YEN,
  MIN_DEPOSIT_YEN,
  PENALTY_YEN,
} from "@/lib/config";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "ログイン | Walk to Wake",
};

const yen = (amount: number) => `¥${amount.toLocaleString("ja-JP")}`;
const startTime = `${String(CHECK_IN_START_HOUR).padStart(2, "0")}:00`;

export default async function LoginPage() {
  // ログイン済みならホームへ返す。proxy.ts ではなくここで判断するのは、
  // クッキーの有無ではなく実際に引けるセッションで決める必要があるため（proxy.ts のコメント）
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/" });
  }

  const steps: ReactNode[] = [
    "目標地点まで実際に行き、その場で現在地を登録する",
    <>
      期限時刻・期間・デポジット額（<span className={styles.mono}>{yen(MIN_DEPOSIT_YEN)}</span> –{" "}
      <span className={styles.mono}>{MAX_DEPOSIT_YEN.toLocaleString("ja-JP")}</span>）を決める
    </>,
    <>
      毎朝 <span className={styles.mono}>{startTime}</span> から期限時刻までの間に、目標地点でチェックインする
    </>,
    <>
      間に合わなかった日は失敗となり、デポジットが <span className={styles.mono}>{yen(PENALTY_YEN)}</span> 減る
    </>,
    "終了日を迎えるか、残高が足りなくなった時点で終了",
  ];

  return (
    <main className={styles.screen}>
      <div className={styles.lead}>
        <h1 className={styles.title}>
          決めた時刻までに、
          <br />
          決めた場所へ。
        </h1>
        <p className={styles.description}>
          間に合わなかった日は、預けたデポジットが{" "}
          <span className={styles.penalty}>{PENALTY_YEN.toLocaleString("ja-JP")}</span>{" "}
          円ずつ減ります。二度寝の代金を先に払っておく仕組みです。
        </p>
      </div>

      <section className={styles.guide}>
        <h2 className={styles.guideHeading}>使い方</h2>
        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <li key={i} className={styles.step}>
              <span className={styles.stepNumber}>{i + 1}</span>
              <span className={styles.stepText}>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className={styles.action}>
        <form action={signInWithGoogle}>
          <button type="submit" className={styles.googleButton}>
            <GoogleIcon />
            Google でログイン
          </button>
        </form>
        <p className={styles.consent}>
          ログインすると <Link href="/terms">利用規約</Link> と{" "}
          <Link href="/privacy">プライバシーポリシー</Link> に同意したものとみなします
        </p>
      </div>
    </main>
  );
}

/** Google のロゴ（画面モックのログインと同じ） */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.92c1.7-1.57 2.68-3.88 2.68-6.64z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.7c-.18-.54-.28-1.11-.28-1.7s.1-1.16.28-1.7V4.96H.96A8.996 8.996 0 000 9c0 1.45.35 2.83.96 4.04l3.01-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
