import type { Metadata } from "next";
import { BackButton } from "@/components/BackButton";
import { SubPageBrandHeader } from "@/components/layout/SubPageBrandHeader";
import { StatusPrimaryLink, StatusScreen } from "@/components/StatusScreen";

export const metadata: Metadata = {
  title: "ページが見つかりません | Walk to Wake",
};

/**
 * 404。存在しないパスと、`notFound()` を投げた画面（他ユーザーのチャレンジ ID など）で出る。
 * 画面モックの NotFound。
 */
export default function NotFound() {
  return (
    <>
      <SubPageBrandHeader />
      <StatusScreen
        tone="neutral"
        icon={
          <svg width="38" height="38" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8z"
              fill="none"
              stroke="#9aa6b2"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <text
              x="12"
              y="13.6"
              textAnchor="middle"
              fontSize="8.5"
              fontWeight="700"
              fill="#9aa6b2"
              fontFamily="IBM Plex Mono, monospace"
            >
              ?
            </text>
          </svg>
        }
        code="ERROR 404"
        title="ページが見つかりません"
        actions={
          <>
            <StatusPrimaryLink href="/">ホームに戻る</StatusPrimaryLink>
            <BackButton />
          </>
        }
      >
        URLが間違っているか、このページは
        <br />
        すでに移動または削除された可能性があります。
      </StatusScreen>
    </>
  );
}
