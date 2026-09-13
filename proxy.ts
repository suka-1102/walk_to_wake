import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * セッションガード。セッションクッキーを持たないアクセスを /login へ寄せる。
 *
 * Next.js 16 で `middleware.ts` は `proxy.ts` に改称された（機能は同じ）。
 *
 * ここで見るのはセッションクッキーの有無だけで、セッションが DB に生きているかは確かめない。
 * Proxy はレンダリングとは別に呼ばれる前段の仕組みで、ここに Prisma を持ち込むと
 * 全リクエストが DB を引くことになるため。**本当の検証は各ページ側の `auth()` で行う**
 * （Next.js の Proxy ガイドも、認可を Proxy だけに頼らず各所で確かめるよう勧めている）。
 *
 * **ログイン済みを理由とする転送はここに置かない。** クッキーだけを見て
 * 「/login に来たログイン済みユーザーを / へ戻す」と、DB からセッションが消えた状態
 * （クッキーだけが残っている状態）で / と /login が互いに転送し合う無限ループになる。
 * ログイン済みユーザーを / へ戻す判断は、実際にセッションを引ける /login のページ側に置く。
 */

/** ログイン前でも開けるパス。規約とポリシーを外すと「ログインをもって同意」が成り立たない */
const PUBLIC_PATHS = ["/login", "/terms", "/privacy"];

/** Auth.js のセッションクッキー。https では `__Secure-` が付く */
const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSessionCookie = SESSION_COOKIE_NAMES.some((name) =>
    request.cookies.has(name),
  );
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!hasSessionCookie && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // 認証のエンドポイントと静的ファイルは対象外。matcher を書かないと画像や CSS まで止める
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
