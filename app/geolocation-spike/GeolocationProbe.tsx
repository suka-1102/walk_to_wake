"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "@/app/geolocation-spike/GeolocationProbe.module.scss";

// Phase 1.1 で lib/config.ts へ移す。ここは実地確認用の暫定値
const ACCURACY_LIMIT_M = 50;

type Sample = {
  latitude: number;
  longitude: number;
  accuracy: number;
  receivedAt: number;
};

type Stats = {
  count: number;
  best: number;
  worst: number;
};

function describeError(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "位置情報の利用が許可されていない。ブラウザの設定を確認する";
    case error.POSITION_UNAVAILABLE:
      return "位置を取得できなかった。空の見える場所で再試行する";
    case error.TIMEOUT:
      return "取得がタイムアウトした";
    default:
      return "不明なエラー";
  }
}

export function GeolocationProbe() {
  const [watching, setWatching] = useState(false);
  const [sample, setSample] = useState<Sample | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setWatching(false);
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("この端末では Geolocation API を使えない");
      return;
    }

    setError(null);
    setSample(null);
    setStats(null);
    setWatching(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setSample({
          latitude,
          longitude,
          accuracy,
          receivedAt: position.timestamp,
        });
        setStats((previous) =>
          previous === null
            ? { count: 1, best: accuracy, worst: accuracy }
            : {
                count: previous.count + 1,
                best: Math.min(previous.best, accuracy),
                worst: Math.max(previous.worst, accuracy),
              },
        );
      },
      (positionError) => {
        setError(describeError(positionError));
        stop();
      },
      { enableHighAccuracy: true, timeout: 30_000, maximumAge: 0 },
    );
  }, [stop]);

  const withinLimit = sample !== null && sample.accuracy <= ACCURACY_LIMIT_M;

  return (
    <div className={styles.probe}>
      <button type="button" className={styles.button} onClick={watching ? stop : start}>
        {watching ? "計測を停止" : "計測を開始"}
      </button>

      {error !== null && <p className={styles.error}>{error}</p>}

      {sample === null ? (
        <p className={styles.waiting}>
          {watching ? "取得中…" : "計測を開始すると座標と accuracy を表示する"}
        </p>
      ) : (
        <dl className={styles.readout}>
          <dt>accuracy</dt>
          <dd className={withinLimit ? styles.pass : styles.fail}>
            {sample.accuracy.toFixed(1)} m（上限 {ACCURACY_LIMIT_M}m：
            {withinLimit ? "採用できる" : "採用できない"}）
          </dd>

          <dt>緯度</dt>
          <dd>{sample.latitude.toFixed(6)}</dd>

          <dt>経度</dt>
          <dd>{sample.longitude.toFixed(6)}</dd>

          <dt>取得時刻</dt>
          <dd>{new Date(sample.receivedAt).toLocaleTimeString("ja-JP")}</dd>
        </dl>
      )}

      {stats !== null && (
        <p className={styles.stats}>
          取得回数 {stats.count} 回 / 最良 {stats.best.toFixed(1)} m / 最悪{" "}
          {stats.worst.toFixed(1)} m
        </p>
      )}
    </div>
  );
}
