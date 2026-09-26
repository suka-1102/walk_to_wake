"use client";

import { SubPageBrandHeader } from "@/components/layout/SubPageBrandHeader";
import { ServerErrorScreen } from "@/components/ServerErrorScreen";

/**
 * 画面の描画中に起きた想定外のエラーの受け皿。ルートレイアウトの中で描画されるので、
 * ヘッダーとフッターはそのまま出る（レイアウト自体の失敗は `global-error.tsx`）。
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <>
      <SubPageBrandHeader />
      <ServerErrorScreen digest={error.digest} onRetry={retry} />
    </>
  );
}
