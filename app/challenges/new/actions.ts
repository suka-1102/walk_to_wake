"use server";

import { auth } from "@/lib/auth";
import { MAX_ACCURACY_METERS } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { validateChallengeInput } from "@/lib/challengeValidation";

export type RegisterSavedLocationInput = {
  name: string;
  latitude: number;
  longitude: number;
  accuracy: number;
};

export type SavedLocationRecord = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type RegisterSavedLocationResult =
  | { ok: true; location: SavedLocationRecord }
  | { ok: false; error: string };

/**
 * 現地で取得した座標を目標地点としてアカウントに保存する。
 *
 * 精度ガードはクライアント側（LocationAcquisition）で既に通っているはずだが、
 * 同じ基準（MAX_ACCURACY_METERS）でサーバー側でも再チェックする。
 * accuracy 自体は判定にのみ使い、DB には保存しない（プライバシーポリシー）。
 */
export async function registerSavedLocation(
  input: RegisterSavedLocationInput,
): Promise<RegisterSavedLocationResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: "ログインが必要です" };
  }

  const name = input.name.trim();
  if (name.length === 0) {
    return { ok: false, error: "名前を入力してください" };
  }

  if (input.accuracy > MAX_ACCURACY_METERS) {
    return { ok: false, error: "位置精度が不十分です" };
  }

  const location = await prisma.savedLocation.create({
    data: {
      userId: session.user.id,
      name,
      latitude: input.latitude,
      longitude: input.longitude,
    },
    select: { id: true, name: true, latitude: true, longitude: true },
  });

  return { ok: true, location };
}

export type CreateChallengeTarget =
  | { type: "existing"; savedLocationId: string }
  | { type: "new"; name: string; latitude: number; longitude: number; accuracy: number };

export type CreateChallengeInput = {
  target: CreateChallengeTarget;
  deadlineHour: number;
  deadlineMinute: number;
  startDate: Date;
  endDate: Date;
  depositYen: number;
};

export type CreateChallengeResult =
  | { ok: true; challengeId: string }
  | { ok: false; error: string };

/**
 * チャレンジを作成する。目標地点は「既存の保存地点を選ぶ」か「現在地を新規登録する」かの
 * どちらかで、新規登録の場合は registerSavedLocation と同じ経路で先に保存してから使う
 * （台帳と Challenge の写しを二重に書くロジックを持たない）。
 *
 * 「1ユーザー1チャレンジ」は Challenge.activeUserId のユニーク制約で担保しているため、
 * 既に進行中のチャレンジがあれば Prisma が一意制約違反（P2002）を投げる。ここで捕まえて
 * 分かりやすいメッセージに変換する。
 */
export async function createChallenge(
  input: CreateChallengeInput,
): Promise<CreateChallengeResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: "ログインが必要です" };
  }

  const userId = session.user.id;

  const validation = validateChallengeInput(
    {
      deadlineHour: input.deadlineHour,
      deadlineMinute: input.deadlineMinute,
      startDate: input.startDate,
      endDate: input.endDate,
      depositYen: input.depositYen,
    },
    new Date(),
  );

  if (!validation.ok) {
    return { ok: false, error: "入力内容を確認してください" };
  }

  let location: SavedLocationRecord;

  if (input.target.type === "existing") {
    const saved = await prisma.savedLocation.findUnique({
      where: { id: input.target.savedLocationId },
      select: { id: true, name: true, latitude: true, longitude: true, userId: true },
    });

    if (saved === null || saved.userId !== userId) {
      return { ok: false, error: "目標地点が見つかりません" };
    }

    location = saved;
  } else {
    const registered = await registerSavedLocation({
      name: input.target.name,
      latitude: input.target.latitude,
      longitude: input.target.longitude,
      accuracy: input.target.accuracy,
    });

    if (!registered.ok) {
      return registered;
    }

    location = registered.location;
  }

  try {
    const challenge = await prisma.challenge.create({
      data: {
        userId,
        activeUserId: userId,
        locationName: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        deadlineHour: input.deadlineHour,
        deadlineMinute: input.deadlineMinute,
        startDate: input.startDate,
        endDate: input.endDate,
        depositYen: input.depositYen,
      },
    });

    return { ok: true, challengeId: challenge.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "既に進行中のチャレンジがあります" };
    }
    throw error;
  }
}
