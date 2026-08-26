import { CHECK_IN_RADIUS_METERS } from "@/lib/config";

/** 緯度経度の組 */
export type Coordinates = {
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS_METERS = 6371000;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** 2点間の距離をメートルで返す（球面三角法・Haversine の公式） */
export const calculateDistanceMeters = (a: Coordinates, b: Coordinates): number => {
  const latDelta = toRadians(b.latitude - a.latitude);
  const lonDelta = toRadians(b.longitude - a.longitude);

  const sinLatHalf = Math.sin(latDelta / 2);
  const sinLonHalf = Math.sin(lonDelta / 2);

  const h =
    sinLatHalf * sinLatHalf +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * sinLonHalf * sinLonHalf;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
};

/** 現在地が目標地点の判定半径内かどうか */
export const isWithinCheckInRadius = (current: Coordinates, target: Coordinates): boolean =>
  calculateDistanceMeters(current, target) <= CHECK_IN_RADIUS_METERS;
