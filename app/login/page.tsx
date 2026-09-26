import type { Metadata } from "next";
import Link from "next/link";
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
          {PENALTY_YEN.toLocaleString("ja-JP")}{" "}
          円ずつ減ります。二度寝の代金を先に払っておく仕組みです。
        </p>
      </div>

      <section className={styles.guide}>
        <h2 className={styles.guideHeading}>使い方</h2>
        <ol className={styles.steps}>
          <li className={styles.step}>
            目標地点まで実際に行き、その場で現在地を登録する
          </li>
          <li className={styles.step}>
            期限時刻・期間・デポジット額（{yen(MIN_DEPOSIT_YEN)} –{" "}
            {MAX_DEPOSIT_YEN.toLocaleString("ja-JP")}）を決める
          </li>
          <li className={styles.step}>
            毎朝 {startTime} から期限時刻までの間に、目標地点でチェックインする
          </li>
          <li className={styles.step}>
            間に合わなかった日は失敗となり、デポジットが {yen(PENALTY_YEN)} 減る
          </li>
          <li className={styles.step}>
            終了日を迎えるか、残高が足りなくなった時点で終了
          </li>
        </ol>
      </section>

      <div className={styles.action}>
        <form action={signInWithGoogle}>
          <button type="submit" className={styles.googleButton}>
            Google でログイン
          </button>
        </form>
        <p className={styles.consent}>
          ログインすると <Link href="/terms">利用規約</Link> と{" "}
          <Link href="/privacy">プライバシーポリシー</Link>{" "}
          に同意したものとみなします
        </p>
      </div>
    </main>
  );
}
