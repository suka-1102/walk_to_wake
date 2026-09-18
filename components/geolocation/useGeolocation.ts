"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Geolocation から得た1点の座標と精度（メートル） */
export type GeolocationSample = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export type GeolocationState =
  | { status: "idle" }
  | { status: "watching"; sample: GeolocationSample | null }
  | { status: "error"; message: string };

const describeError = (error: GeolocationPositionError): string => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "位置情報の利用が許可されていない。ブラウザの設定を確認する";
    case error.POSITION_UNAVAILABLE:
      return "位置を取得できなかった。空の見える場所で再試行する";
    case error.TIMEOUT:
      return "取得がタイムアウトした";
    default:
      return "不明なエラーで位置を取得できなかった";
  }
};

/**
 * Geolocation API を `watchPosition` で継続的に読み、最新の座標と accuracy を返すフック。
 *
 * ここが扱うのは「取得できるか」だけ。精度ガードや収束待ちなど「採用してよいか」の
 * 判断は呼び出し側（4.2）の責務にする。
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ status: "idle" });
  const watchIdRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState({ status: "error", message: "この端末では位置情報を利用できない" });
      return;
    }

    stop();
    setState({ status: "watching", sample: null });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setState({ status: "watching", sample: { latitude, longitude, accuracy } });
      },
      (error) => {
        stop();
        setState({ status: "error", message: describeError(error) });
      },
      { enableHighAccuracy: true, timeout: 30_000, maximumAge: 0 },
    );
  }, [stop]);

  return { state, start, stop };
}
