"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * 画面モックで、共通ヘッダー（ロゴ＋ハンバーガー）の代わりに「戻る＋タイトル」だけを
 * ヘッダーにしている画面（チャレンジ作成 `/challenges/new`、チャレンジ詳細 `/challenges/[id]`）では、
 * 共通ヘッダーを出さない。`children` はサーバー側で描画済みの `SiteHeader`。
 * `/challenges`（履歴）はこれらに当たらない。
 */
export const isSubPage = (pathname: string): boolean =>
  pathname === "/challenges/new" || /^\/challenges\/[^/]+$/.test(pathname);

export function SubPageHeaderSwitch({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return isSubPage(pathname) ? null : children;
}
