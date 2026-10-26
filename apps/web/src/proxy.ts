import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

/** ログインなしでアクセスできるパス（完全一致） */
const publicRoutes = ["/", "/login", "/signup"];

/**
 * 画面保護の入口チェック。
 *
 * 公開パス以外でセッション cookie がなければ `/login` へリダイレクトする。
 * cookie の有無だけを見る簡易チェックのため、偽造された cookie は通る。
 * 正式なセッション検証は Server Component 側の `requireSession` が行う。
 * Server Action の POST はチェックせずに通す（理由は下のコメント）。
 *
 * @param request - 受信したリクエスト
 * @returns 通す場合は `NextResponse.next()`、未ログインの場合は `/login` へのリダイレクト
 */
export function proxy(request: NextRequest) {
  // Server Action の POST（next-action ヘッダー付き）は /login へ移さない。
  // 移すとクライアントが RSC ではなく /login の HTML を受け取り、エラーになる。
  // 認証は Server Action が呼ぶ api が確かめ、401 なら Server Action が redirect で /login へ移す
  if (request.headers.has("next-action")) {
    return NextResponse.next();
  }
  // 公開パスなら通す
  if (isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  // 非公開パスでログインの有無をチェック（簡易チェック）
  if (getSessionCookie(request)) {
    return NextResponse.next();
  }
  // どちらにも該当しない場合はログインへリダイレクト
  const url = new URL("/login", request.url);
  url.searchParams.set(
    "redirect",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return NextResponse.redirect(url);
}

/**
 * 公開パスかどうかを判定する。
 *
 * @param pathname - リクエストのパス名（例: `/login`）。ホストやクエリは含めない
 * @returns 公開パスなら `true`
 */
function isPublicPath(pathname: string): boolean {
  return publicRoutes.includes(pathname);
}

export const config = {
  // 静的ファイルや Next.js 内部のパスでは proxy を動かさない
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
