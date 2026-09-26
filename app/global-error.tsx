"use client";

import { BrandHeader } from "@/components/layout/BrandHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ServerErrorScreen } from "@/components/ServerErrorScreen";
import "./globals.scss";
import styles from "./layout.module.scss";

/**
 * ルートレイアウトそのものが落ちたときの受け皿（ヘッダーがセッションを引くため、DB に
 * 繋がらないときなどはここに来る）。ルートレイアウトの代わりに描画されるので、
 * `<html>` と `<body>` を自前で持つ。セッションを引かないヘッダーを使い、フォントは
 * ルートレイアウトで読み込むものが届かないためシステムフォントで出る。
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="ja">
      <body>
        <div className={styles.shell}>
          <div className={styles.column}>
            <BrandHeader />
            <div className={styles.main}>
              <ServerErrorScreen digest={error.digest} onRetry={retry} />
            </div>
            <SiteFooter />
          </div>
        </div>
      </body>
    </html>
  );
}
