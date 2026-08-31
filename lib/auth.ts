import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Auth.js の設定。プロバイダは Google のみで、自前のパスワード管理は持たない。
 *
 * 認証情報の永続化（アダプタ）はまだ入れていないため、セッションは JWT に載る。
 * クライアント ID・シークレットとセッションの暗号鍵は Auth.js が
 * `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` / `AUTH_SECRET` から自動で読む。
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
});
