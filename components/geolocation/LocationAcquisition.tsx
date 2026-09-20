"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  useGeolocation,
  type GeolocationSample,
} from "@/components/geolocation/useGeolocation";
import { LOCATION_CONVERGENCE_TIMEOUT_MS, MAX_ACCURACY_METERS } from "@/lib/config";
import styles from "./LocationAcquisition.module.scss";

type Props = {
  /** 精度十分な座標が得られたときに呼ばれる */
  onAcquired: (sample: GeolocationSample) => void;
};

/**
 * 初回の位置情報取得の説明を見せたかどうか。ブラウザの許可ダイアログの前に
 * 「距離判定にのみ使い、判定に使った現在地は保存しない」ことを示すため、
 * 初回だけ出す（同意の記録ではなく表示制御なので DB には持たない。screens.md）。
 */
const NOTICE_ACKNOWLEDGED_KEY = "walk-to-wake:geolocation-notice-acknowledged";

// localStorage は SSR 時に存在しないため、useEffect で setState する代わりに
// useSyncExternalStore で読む（React 公式が外部ストアの読み取りに推奨する方法で、
// サーバーでは常に「未確認」を返し、ハイドレーション後にクライアントの実値へ切り替わる）。
const subscribeToNothing = () => () => {};

const getNoticeAcknowledgedSnapshot = (): boolean => {
  try {
    return localStorage.getItem(NOTICE_ACKNOWLEDGED_KEY) === "true";
  } catch {
    return false;
  }
};

const getNoticeAcknowledgedServerSnapshot = (): boolean => false;

/**
 * 精度十分な座標が得られるまで取得を続ける共有UI（`/challenges/new` と `/check-in` で使う）。
 *
 * `useGeolocation` は「取得できるか」しか見ないため、ここで「採用してよいか」を判定する。
 * 収束を待っても `MAX_ACCURACY_METERS` を満たさない場合は、手動の再取得ボタンを出す。
 */
export function LocationAcquisition({ onAcquired }: Props) {
  const { state, start, stop } = useGeolocation();
  const [started, setStarted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const noticeAcknowledged = useSyncExternalStore(
    subscribeToNothing,
    getNoticeAcknowledgedSnapshot,
    getNoticeAcknowledgedServerSnapshot,
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const acceptedRef = useRef(false);

  const clearTimer = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => clearTimer, []);

  const begin = () => {
    clearTimer();
    acceptedRef.current = false;
    setStarted(true);
    setTimedOut(false);
    start();
    timeoutRef.current = setTimeout(() => {
      stop();
      setTimedOut(true);
    }, LOCATION_CONVERGENCE_TIMEOUT_MS);
  };

  const acknowledgeNoticeAndBegin = () => {
    try {
      localStorage.setItem(NOTICE_ACKNOWLEDGED_KEY, "true");
    } catch {
      // 保存できなくても表示制御だけの話なので、今回の取得自体は進めてよい
    }
    begin();
  };

  // watchPosition から届く座標を監視し、精度十分なものが来たら採用して呼び出し元へ通知する。
  useEffect(() => {
    if (!started || timedOut || acceptedRef.current) {
      return;
    }

    if (
      state.status === "watching" &&
      state.sample !== null &&
      state.sample.accuracy <= MAX_ACCURACY_METERS
    ) {
      acceptedRef.current = true;
      clearTimer();
      stop();
      onAcquired(state.sample);
    }
  }, [state, started, timedOut, stop, onAcquired]);

  const phase = !started
    ? "idle"
    : state.status === "error"
      ? "error"
      : timedOut
        ? "insufficient"
        : "measuring";

  if (phase === "idle") {
    if (!noticeAcknowledged) {
      return (
        <div className={styles.container}>
          <button type="button" className={styles.button} onClick={acknowledgeNoticeAndBegin}>
            同意して現在地を取得
          </button>
          <p className={styles.caption}>
            取得した現在地は距離判定にのみ使用します。
            <Link href="/privacy">プライバシーポリシー</Link>
          </p>
        </div>
      );
    }

    return (
      <div className={styles.container}>
        <button type="button" className={styles.button} onClick={begin}>
          現在地を取得
        </button>
      </div>
    );
  }

  if (phase === "measuring") {
    return <p className={styles.waiting}>取得中…</p>;
  }

  const lastAccuracy = state.status === "watching" ? state.sample?.accuracy : undefined;

  if (phase === "error") {
    return (
      <div className={styles.container}>
        <div className={styles.statusCard}>
          <span className={styles.warningBadge}>!</span>
          <p className={styles.statusMessage}>
            {state.status === "error" ? state.message : "位置情報を取得できなかった"}
          </p>
        </div>
        <button type="button" className={styles.button} onClick={begin}>
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.statusCard}>
        <span className={styles.warningBadge}>!</span>
        <p className={styles.statusMessage}>
          精度が不十分です。空の見える場所で再取得してください。iPhoneの場合は
          「設定 → プライバシーとセキュリティ → 位置情報サービス」でこのアプリの
          「正確な位置情報」がオンになっているかも確認してください。
        </p>
        {lastAccuracy !== undefined && (
          <div className={styles.accuracyCompare}>
            <div className={styles.compareRow}>
              <span>取得した精度</span>
              <span className={styles.compareError}>±{Math.round(lastAccuracy)}m</span>
            </div>
            <div className={styles.compareRow}>
              <span>必要な精度</span>
              <span className={styles.compareOk}>±{MAX_ACCURACY_METERS}m 以内</span>
            </div>
          </div>
        )}
      </div>
      <button type="button" className={styles.button} onClick={begin}>
        再取得
      </button>
    </div>
  );
}
