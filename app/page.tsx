import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import styles from "./page.module.scss";

/**
 * ホーム。進行中のチャレンジを出す本来の中身は 6.2 で作るため、今はセッションの確認だけを行う。
 *
 * proxy.ts はセッションクッキーの有無しか見ないので、セッションが本当に生きているかは
 * ここで確かめる。以降のページも同じようにページ側で `auth()` を通す。
 */
export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // ログアウトの正式な置き場はマイページ（6.6）。ここに置いているのは
  // ホームの中身ができるまでログイン状態を切り替えて動作を確かめるための仮置き
  async function signOutFromHome() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>ログイン済み</h1>
      <p className={styles.note}>
        {session.user.name ?? session.user.email} でログインしています。
        ホームの中身はこれから作ります。
      </p>
      <form action={signOutFromHome}>
        <button type="submit" className={styles.signOutButton}>
          ログアウト
        </button>
      </form>
    </main>
  );
}
