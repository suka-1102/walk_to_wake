"use server";

import { auth } from "@/lib/auth";
import { MAX_ACCURACY_METERS } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export type RegisterSavedLocationInput = {
  name: string;
  latitude: number;
  longitude: number;
  accuracy: number;
};

export type RegisterSavedLocationResult =
  | { ok: true }
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

  await prisma.savedLocation.create({
    data: {
      userId: session.user.id,
      name,
      latitude: input.latitude,
      longitude: input.longitude,
    },
  });

  return { ok: true };
}
