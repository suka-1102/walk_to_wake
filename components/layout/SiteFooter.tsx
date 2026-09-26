import Link from "next/link";
import styles from "./SiteFooter.module.scss";

/**
 * 全ページ共通のフッター。規約・ポリシー・特定商取引法に基づく表記への入口をここに一本化する。
 * ログイン前後を問わず出す（ログイン前に読めなければ「ログインをもって同意」が成り立たない）。
 * 著作権表示は置かない（screens.md）。
 */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <Link href="/terms">利用規約</Link>
      <span aria-hidden="true"> ・ </span>
      <Link href="/privacy">プライバシーポリシー</Link>
      <span aria-hidden="true"> ・ </span>
      <Link href="/tokushoho">特定商取引法に基づく表記</Link>
    </footer>
  );
}
