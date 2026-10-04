"use client";

import { usePathname } from "next/navigation";
import { BrandHeader } from "./BrandHeader";
import { isSubPage } from "./SubPageHeaderSwitch";

/**
 * 共通ヘッダーを隠している画面（`SubPageHeaderSwitch`）でエラーや 404 になると、
 * 画面自身の「戻る＋タイトル」ヘッダーも描画されず、ヘッダーが何も残らない。
 * その場合だけロゴのヘッダーを補う。ほかの画面では共通ヘッダーがあるので何も出さない。
 */
export function SubPageBrandHeader() {
  const pathname = usePathname();

  return isSubPage(pathname) ? <BrandHeader /> : null;
}
