"use client";

import { useEffect, useRef, useState } from "react";
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
 * 精度十分な座標が得られるまで取得を続ける共有UI（`/challenges/new` と `/check-in` で使う）。
 *
 * `useGeolocation` は「取得できるか」しか見ないため、ここで「採用してよいか」を判定する。
 * 収束を待っても `MAX_ACCURACY_METERS` を満たさない場合は、手動の再取得ボタンを出す。
 */
export function LocationAcquisition({ onAcquired }: Props) {
  const { state, start, stop } = useGeolocation();
  const [started, setStarted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
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

  if (phase === "error") {
    return (
      <div className={styles.container}>
        <p className={styles.error}>
          {state.status === "error" ? state.message : "位置情報を取得できなかった"}
        </p>
        <button type="button" className={styles.button} onClick={begin}>
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.error}>
        精度が不十分。空の見える場所で再取得してください。iPhoneの場合は
        「設定 → プライバシーとセキュリティ → 位置情報サービス」でこのアプリの
        「正確な位置情報」がオンになっているかも確認してください。
      </p>
      <button type="button" className={styles.button} onClick={begin}>
        再取得
      </button>
    </div>
  );
}
