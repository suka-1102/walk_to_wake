"use client";

import { useState, type ReactNode } from "react";
import {
  StatusDetails,
  StatusPrimaryButton,
  StatusScreen,
  StatusSubLink,
} from "@/components/StatusScreen";

const formatClock = (date: Date): string =>
  [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");

/**
 * エラーの画面（画面モックの ServerError）。`error.tsx` と `global-error.tsx` が共用する。
 * 出すのは発生時刻と、サーバー側のログと突き合わせる参照番号（`digest`）だけ。
 * 例外のメッセージは出さない（本番ではサーバー側の詳細がクライアントに渡らない）。
 */
export function ServerErrorScreen({
  digest,
  onRetry,
}: {
  digest?: string;
  onRetry: () => void;
}) {
  // SSR 中にエラーになった場合、サーバーとブラウザで秒がずれるため、ずれは黙認する
  const [occurredAt] = useState(() => new Date());

  const rows: [string, ReactNode][] = [
    ["発生時刻", <span key="time" suppressHydrationWarning>{formatClock(occurredAt)}</span>],
  ];

  if (digest !== undefined) {
    rows.push(["参照番号", digest]);
  }

  return (
    <StatusScreen
      tone="warning"
      icon={
        <svg width="40" height="40" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M10 2L18.5 17H1.5L10 2z"
            fill="none"
            stroke="#8a6d16"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <line
            x1="10"
            y1="8"
            x2="10"
            y2="12"
            stroke="#8a6d16"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="10" cy="14.5" r="0.9" fill="#8a6d16" />
        </svg>
      }
      title="エラーが発生しました"
      details={<StatusDetails rows={rows} />}
      actions={
        <>
          <StatusPrimaryButton onClick={onRetry}>もう一度読み込む</StatusPrimaryButton>
          <StatusSubLink href="/">ホームに戻る</StatusSubLink>
        </>
      }
    >
      サーバーで問題が発生しました。
      <br />
      しばらくしてから、もう一度お試しください。
    </StatusScreen>
  );
}
