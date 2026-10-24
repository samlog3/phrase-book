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
 *
 * @param request - 受信したリクエスト
 * @returns 通す場合は `NextResponse.next()`、未ログインの場合は `/login` へのリダイレクト
 */
export function proxy(request: NextRequest) {
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
