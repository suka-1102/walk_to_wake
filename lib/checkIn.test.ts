import { describe, expect, it } from "vitest";
import { judgeCheckIn, type CheckInChallenge, type CheckInPosition } from "@/lib/checkIn";
import { CHECK_IN_RADIUS_METERS, CHECK_IN_START_HOUR, MAX_ACCURACY_METERS } from "@/lib/config";
import type { Coordinates } from "@/lib/distance";

const TARGET: Coordinates = { latitude: 35.681236, longitude: 139.767125 };

const EARTH_RADIUS_METERS = 6371000;

/** 目標地点から真北へ指定メートルだけ離れた現在地を作る */
const positionNorthOf = (meters: number, accuracy = 10): CheckInPosition => ({
  latitude: TARGET.latitude + (meters / EARTH_RADIUS_METERS) * (180 / Math.PI),
  longitude: TARGET.longitude,
  accuracy,
});

const AT_TARGET = positionNorthOf(0);

/** 期間は 2026-08-26〜2026-08-28、期限は 7:30。実行環境のタイムゾーンは vitest.config.mts で JST に固定している */
const CHALLENGE: CheckInChallenge = {
  target: TARGET,
  deadline: { hour: 7, minute: 30 },
  startDate: new Date(2026, 7, 26),
  endDate: new Date(2026, 7, 28),
};

const at = (day: number, hour: number, minute = 0, second = 0, millisecond = 0): Date =>
  new Date(2026, 7, day, hour, minute, second, millisecond);

describe("judgeCheckIn", () => {
  it("期間内・受付時間内・精度十分・判定半径内なら成立", () => {
    expect(judgeCheckIn(at(27, 6), AT_TARGET, CHALLENGE)).toEqual({ ok: true });
  });

  describe("期間", () => {
    it("開始日の前日は beforeStart", () => {
      expect(judgeCheckIn(at(25, 6), AT_TARGET, CHALLENGE)).toMatchObject({
        ok: false,
        reason: "beforeStart",
      });
    });

    it("開始日当日は成立", () => {
      expect(judgeCheckIn(at(26, 6), AT_TARGET, CHALLENGE)).toEqual({ ok: true });
    });

    it("終了日当日は成立", () => {
      expect(judgeCheckIn(at(28, 6), AT_TARGET, CHALLENGE)).toEqual({ ok: true });
    });

    it("終了日の翌日は afterEnd", () => {
      expect(judgeCheckIn(at(29, 6), AT_TARGET, CHALLENGE)).toMatchObject({
        ok: false,
        reason: "afterEnd",
      });
    });
  });

  describe("受付時間", () => {
    it("受付開始時刻の 1 ミリ秒前は beforeWindow", () => {
      const now = at(27, CHECK_IN_START_HOUR - 1, 59, 59, 999);
      expect(judgeCheckIn(now, AT_TARGET, CHALLENGE)).toMatchObject({
        ok: false,
        reason: "beforeWindow",
      });
    });

    it("受付開始時刻ちょうどは成立", () => {
      expect(judgeCheckIn(at(27, CHECK_IN_START_HOUR), AT_TARGET, CHALLENGE)).toEqual({ ok: true });
    });

    it("期限時刻ちょうどは成立", () => {
      expect(judgeCheckIn(at(27, 7, 30), AT_TARGET, CHALLENGE)).toEqual({ ok: true });
    });

    it("期限時刻の 1 秒後は pastDeadline", () => {
      expect(judgeCheckIn(at(27, 7, 30, 1), AT_TARGET, CHALLENGE)).toMatchObject({
        ok: false,
        reason: "pastDeadline",
      });
    });

    it("期限を過ぎていれば、目標地点にいて精度が十分でも pastDeadline", () => {
      expect(judgeCheckIn(at(27, 23), AT_TARGET, CHALLENGE)).toMatchObject({
        ok: false,
        reason: "pastDeadline",
      });
    });
  });

  describe("位置精度", () => {
    it("accuracy が上限ちょうどなら成立", () => {
      const position = positionNorthOf(0, MAX_ACCURACY_METERS);
      expect(judgeCheckIn(at(27, 6), position, CHALLENGE)).toEqual({ ok: true });
    });

    it("accuracy が上限を超えれば accuracyTooLow と、その accuracy を返す", () => {
      const position = positionNorthOf(0, MAX_ACCURACY_METERS + 0.1);
      expect(judgeCheckIn(at(27, 6), position, CHALLENGE)).toEqual({
        ok: false,
        reason: "accuracyTooLow",
        accuracyMeters: MAX_ACCURACY_METERS + 0.1,
      });
    });

    it("accuracy が NaN なら accuracyTooLow", () => {
      const position = positionNorthOf(0, Number.NaN);
      expect(judgeCheckIn(at(27, 6), position, CHALLENGE)).toMatchObject({
        ok: false,
        reason: "accuracyTooLow",
      });
    });

    it("精度不足は距離より先に判定する", () => {
      const position = positionNorthOf(CHECK_IN_RADIUS_METERS * 10, MAX_ACCURACY_METERS + 1);
      expect(judgeCheckIn(at(27, 6), position, CHALLENGE)).toMatchObject({
        ok: false,
        reason: "accuracyTooLow",
      });
    });
  });

  describe("距離", () => {
    it("判定半径のわずか内側なら成立", () => {
      const position = positionNorthOf(CHECK_IN_RADIUS_METERS - 0.01);
      expect(judgeCheckIn(at(27, 6), position, CHALLENGE)).toEqual({ ok: true });
    });

    it("判定半径のわずか外側なら outOfRange と、その距離を返す", () => {
      const position = positionNorthOf(CHECK_IN_RADIUS_METERS + 0.01);
      const result = judgeCheckIn(at(27, 6), position, CHALLENGE);

      expect(result).toMatchObject({ ok: false, reason: "outOfRange" });
      if (!result.ok && result.reason === "outOfRange") {
        expect(result.distanceMeters).toBeCloseTo(CHECK_IN_RADIUS_METERS + 0.01, 3);
      }
    });
  });
});
