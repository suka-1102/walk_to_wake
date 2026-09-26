import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import styles from "./SiteHeader.module.scss";

/**
 * ロゴとアプリ名だけのヘッダー。セッションを引かないので、`SiteHeader` が使えない場面
 * （ルートレイアウトが落ちたときの `global-error`、共通ヘッダーを隠している画面のエラー表示）で使う。
 */
export function BrandHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        <BrandLogo />
        <span className={styles.brandName}>WALK TO WAKE</span>
      </Link>
    </header>
  );
}
