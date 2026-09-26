"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { validateDisplayName } from "@/lib/displayName";
import { prisma } from "@/lib/prisma";

/** Auth.js のセッションクッキー。https では `__Secure-` が付く（proxy.ts と同じ名前） */
const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

/** 保存した目標地点を削除する。進行中・終了済みのチャレンジは座標を写して持つので影響しない */
export async function deleteSavedLocation(id: string): Promise<void> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // 他のユーザーの地点を消せないよう userId も条件に含める
  await prisma.savedLocation.deleteMany({ where: { id, userId: session.user.id } });

  revalidatePath("/mypage");
}

export type UpdateDisplayNameResult = { ok: true } | { ok: false; error: string };

/** 表示名を変更する。アプリ内だけの名前で、Google 側のアカウント名は変更しない */
export async function updateDisplayName(input: string): Promise<UpdateDisplayNameResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: "ログインが必要です" };
  }

  const validation = validateDisplayName(input);

  if (!validation.ok) {
    return {
      ok: false,
      error: validation.error === "empty" ? "表示名を入力してください" : "表示名が長すぎます",
    };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { displayName: validation.name },
  });

  revalidatePath("/mypage");

  return { ok: true };
}

/**
 * アカウントを削除する。取り返しがつかない。
 *
 * 保存した目標地点・チャレンジ・チェックイン・セッションは、`User` の削除に連鎖して消える
 * （スキーマの `onDelete: Cascade`）。進行中のチャレンジがあってもデポジットは戻らない。
 * 確認は呼び出し側のダイアログで済ませてある前提で、ここでは確認しない。
 *
 * セッションも連鎖して消えているため、Auth.js の `signOut` は使わない
 * （存在しないセッションの削除でアダプタが失敗しうる）。クッキーを消して `/login` へ戻す。
 */
export async function deleteAccount(): Promise<void> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  await prisma.user.delete({ where: { id: session.user.id } });

  const cookieStore = await cookies();
  for (const name of SESSION_COOKIE_NAMES) {
    cookieStore.delete(name);
  }

  redirect("/login");
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
