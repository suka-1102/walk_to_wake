import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

/**
 * Auth.js の設定。プロバイダは Google のみで、自前のパスワード管理は持たない。
 *
 * PrismaAdapter によりユーザー・アカウント・セッションを DB に永続化する
 * （セッションは JWT ではなく DB 参照に切り替わる）。
 * クライアント ID・シークレットとセッションの暗号鍵は Auth.js が
 * `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` / `AUTH_SECRET` から自動で読む。
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  events: {
    // displayName は NOT NULL のため createUser 時点では空文字で作成される。
    // ここで Google プロフィールの名前を初期値として書き戻す
    async createUser({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { displayName: user.name ?? "" },
      });
    },
  },
});
