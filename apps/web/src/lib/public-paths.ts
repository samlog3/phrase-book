/** ログインなしでアクセスできるパス（完全一致） */
const exactPublicRoutes = ["/", "/login", "/signup"];

/** ログインなしでアクセスできるパス（そのパスと、その下のパス） */
const prefixPublicRoutes = ["/public"];

/**
 * 公開パスかどうかを判定する。
 * 前方一致は `/public` そのものか `/public/` で始まるものだけにする。
 * `startsWith("/public")` だけだと `/publicxxx` も通ってしまうため。
 *
 * @param pathname - リクエストのパス名（例: `/login`）。ホストやクエリは含めない
 * @returns 公開パスなら `true`
 */
export function isPublicPath(pathname: string): boolean {
  if (exactPublicRoutes.includes(pathname)) return true;
  return prefixPublicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
