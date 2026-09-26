"use client";

import { useSyncExternalStore } from "react";

type Props = {
  /** 今日の期限時刻（エポックミリ秒） */
  deadlineAtMs: number;
  /** サーバーが描画した時点の時刻（エポックミリ秒）。ハイドレーションで表示がずれないよう最初の1回だけ使う */
  renderedAtMs: number;
};

const subscribeToEverySecond = (onChange: () => void) => {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
};

const getNowSecond = (): number => Math.floor(Date.now() / 1000);

const pad = (value: number): string => String(value).padStart(2, "0");

/** 期限までの残り時間を 1 秒ごとに更新して `H:MM:SS` で出す。ブラウザの時計を使う表示専用で、判定には使わない */
export function DeadlineCountdown({ deadlineAtMs, renderedAtMs }: Props) {
  const nowSecond = useSyncExternalStore(subscribeToEverySecond, getNowSecond, () =>
    Math.floor(renderedAtMs / 1000)
  );

  const remainingSeconds = Math.max(0, Math.floor(deadlineAtMs / 1000) - nowSecond);
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  return (
    <span>
      {hours}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
}
