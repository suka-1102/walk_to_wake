import { describe, expect, it } from "vitest";
import { calculateDistanceMeters, isWithinCheckInRadius, type Coordinates } from "@/lib/distance";
import { CHECK_IN_RADIUS_METERS } from "@/lib/config";

const TOKYO_STATION: Coordinates = { latitude: 35.681236, longitude: 139.767125 };

const EARTH_RADIUS_METERS = 6371000;

/** 基準点から真北へ指定メートルだけ離れた座標を作る（同じ経度上なので Haversine の値は理論値と厳密に一致する） */
const northOf = (base: Coordinates, meters: number): Coordinates => {
  const latDeltaRadians = meters / EARTH_RADIUS_METERS;
  return {
    latitude: base.latitude + (latDeltaRadians * 180) / Math.PI,
    longitude: base.longitude,
  };
};

describe("calculateDistanceMeters", () => {
  it("同じ地点なら 0 を返す", () => {
    expect(calculateDistanceMeters(TOKYO_STATION, TOKYO_STATION)).toBeCloseTo(0, 6);
  });

  it("既知の距離だけ離れた2点の距離を正しく計算する", () => {
    const target = northOf(TOKYO_STATION, 1000);
    expect(calculateDistanceMeters(TOKYO_STATION, target)).toBeCloseTo(1000, 3);
  });
});

describe("isWithinCheckInRadius", () => {
  it("判定半径のごくわずか内側なら true", () => {
    const target = northOf(TOKYO_STATION, CHECK_IN_RADIUS_METERS - 0.001);
    expect(isWithinCheckInRadius(TOKYO_STATION, target)).toBe(true);
  });

  it("判定半径のごくわずか外側なら false", () => {
    const target = northOf(TOKYO_STATION, CHECK_IN_RADIUS_METERS + 0.001);
    expect(isWithinCheckInRadius(TOKYO_STATION, target)).toBe(false);
  });

  it("判定半径の内側なら true", () => {
    const target = northOf(TOKYO_STATION, CHECK_IN_RADIUS_METERS - 1);
    expect(isWithinCheckInRadius(TOKYO_STATION, target)).toBe(true);
  });

  it("目標地点から大きく離れていれば false", () => {
    const farAway: Coordinates = { latitude: 35.170915, longitude: 136.881537 };
    expect(isWithinCheckInRadius(TOKYO_STATION, farAway)).toBe(false);
  });
});
