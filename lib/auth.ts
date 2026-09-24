import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

// Auth.js の既定の session コールバックは name・email・image しか session.user に残さない
// （node_modules/@auth/core/src/lib/init.ts の defaultCallbacks.session）。
// 「誰の目標地点・チャレンジか」を判定するのに userId が要るため、id を残すよう上書きする
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

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
  pages: {
    // Auth.js 既定のログイン画面ではなく自前の /login を使う
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }) {
      return { ...session, user: { ...session.user, id: user.id } };
    },
  },
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
