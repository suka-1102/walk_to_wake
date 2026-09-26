import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { auth } from "@/lib/auth";
import { HamburgerMenu } from "./HamburgerMenu";
import styles from "./SiteHeader.module.scss";

/**
 * 全ページ共通のヘッダー。左にロゴとアプリ名、右にハンバーガーメニューを置く。
 *
 * ハンバーガーを出すのはログイン後だけ。メニューの行き先がすべて認証必須なので、
 * ログイン前に出しても押せる項目がない（screens.md）。
 * 判定は実際に引けるセッションで行う（クッキーの有無ではなく、proxy.ts のコメントと同じ理由）。
 */
export async function SiteHeader() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  return (
    <header className={styles.header}>
      <Link href={isLoggedIn ? "/" : "/login"} className={styles.brand}>
        <BrandLogo />
        <span className={styles.brandName}>WALK TO WAKE</span>
      </Link>
      {isLoggedIn && <HamburgerMenu />}
    </header>
  );
}
