import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSavedLocations } from "@/app/challenges/new/queries";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signOutAction } from "./actions";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { DisplayNameEditor } from "./DisplayNameEditor";
import { SavedLocationList } from "./SavedLocationList";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "マイページ | Walk to Wake",
};

/**
 * マイページ。保存した目標地点の管理、アカウント設定、ログアウトを1画面に置く。
 * 下位ページには切らない（screens.md）。
 */
export default async function MyPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const [user, savedLocations] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } }),
    getSavedLocations(userId),
  ]);

  // 表示名は Google プロフィールの名前を初期値に持つ。空のままなら Google の名前で補う
  const displayName = user?.displayName || session.user.name || "名前未設定";

  return (
    <main className={styles.screen}>
      <div className={styles.content}>
        <h1 className={styles.title}>マイページ</h1>

        <section>
          <h2 className={styles.sectionTitle}>保存した目標地点</h2>
          <SavedLocationList locations={savedLocations} />
        </section>

        <section>
          <h2 className={styles.sectionTitle}>アカウント設定</h2>
          <div className={styles.card}>
            <DisplayNameEditor displayName={displayName} />
            <DeleteAccountDialog />
          </div>
        </section>
      </div>

      <form action={signOutAction} className={styles.action}>
        <button type="submit" className={styles.signOutButton}>
          ログアウト
        </button>
      </form>
    </main>
  );
}
