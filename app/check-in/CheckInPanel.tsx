"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { LocationAcquisition } from "@/components/geolocation/LocationAcquisition";
import type { GeolocationSample } from "@/components/geolocation/useGeolocation";
import { checkIn } from "./actions";
import { describeCheckInFailure, isRetryable, type CheckInFailure } from "./messages";
import styles from "./CheckInPanel.module.scss";

type Phase =
  | { status: "acquiring" }
  | { status: "submitting" }
  | { status: "succeeded" }
  | { status: "failed"; failure: CheckInFailure };

/**
 * 現在地の取得 → サーバーでの判定 → 結果の表示までを受け持つ。
 *
 * 精度の採否は `LocationAcquisition` が、成立の判定は `checkIn`（サーバー）が行う。
 * ここは座標を渡して結果を出すだけで、距離や時刻の判定は持たない。
 */
export function CheckInPanel() {
  const [phase, setPhase] = useState<Phase>({ status: "acquiring" });
  // 取り直すときに LocationAcquisition を作り直して、取得を最初からやり直させる
  const [attempt, setAttempt] = useState(0);

  const handleAcquired = useCallback(async (sample: GeolocationSample) => {
    setPhase({ status: "submitting" });

    try {
      const result = await checkIn(sample);
      setPhase(result.ok ? { status: "succeeded" } : { status: "failed", failure: result });
    } catch {
      setPhase({ status: "failed", failure: { reason: "requestFailed" } });
    }
  }, []);

  const retry = () => {
    setAttempt((current) => current + 1);
    setPhase({ status: "acquiring" });
  };

  if (phase.status === "acquiring") {
    return <LocationAcquisition key={attempt} onAcquired={handleAcquired} />;
  }

  if (phase.status === "submitting") {
    return <p className={styles.waiting}>判定中…</p>;
  }

  if (phase.status === "succeeded") {
    return (
      <div className={styles.result}>
        <span className={styles.successBadge}>✓</span>
        <p className={styles.resultTitle}>チェックインしました</p>
        <Link href="/" className={styles.primaryLink}>
          ホームへ
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.result}>
      <span className={styles.failureBadge}>!</span>
      <p className={styles.resultMessage}>{describeCheckInFailure(phase.failure)}</p>
      {isRetryable(phase.failure) ? (
        <button type="button" className={styles.primaryButton} onClick={retry}>
          もう一度取得する
        </button>
      ) : (
        <Link href="/" className={styles.primaryLink}>
          ホームへ
        </Link>
      )}
    </div>
  );
}
