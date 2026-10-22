import "server-only";
import { cookies } from "next/headers";
import { authClient } from "./auth-client";
import { cache } from "react";
import { redirect } from "next/navigation";

/**
 * api に問い合わせて、Cookie が指すセッションが有効か確認する。移動はしない。
 * - 有効なら { userId, email }、セッションなしなら null を返す
 * - api の障害など確認できなかったときは投げる（error.tsx 行き）
 * - cache() で包んでいるので、同じ描画中に何度呼んでも api への問い合わせは1回
 * - Client Component に渡しても安全なよう、必要な値だけに絞って返す
 */
export const getSession = cache(async () => {
  // 転送するのは cookie ヘッダーだけ（host などは api に送らない）
  const cookie = (await cookies()).toString();
  const { data, error } = await authClient.getSession({
    fetchOptions: {
      headers: { cookie },
    },
  });
  // セッションなしは data: null / error: null で返る。error は「確認できなかった」場合
  if (error) {
    throw new Error(`get-session failed: ${error.status} ${error.statusText}`, {
      cause: error,
    });
  }

  return data ? { userId: data.user.id, email: data.user.email } : null;
});

/**
 * 保護ページ用。未ログインなら /login へ移動し、ログイン済みならセッションを返す。
 * - returnTo: ログイン後に戻る自分のパス（例: "/phrases"）。省略可能
 *   - 渡すと /login?redirect=<returnTo> へ移動する。Server Component からは今のパスを取れないため、呼び出し側が渡す
 *   - 省略すると /login へ移動し、ログイン後は既定の移動先（/phrases）に戻る
 *   - 外部入力ではなく呼び出し側が決めた値を渡すこと（検証はログイン後に ?redirect= を読む側で行う）
 * - redirect() は例外を投げて動くため、try/catch の中では呼ばないこと
 * - 中で cookies() を読むので、<Suspense> の内側で呼ぶこと
 */
export async function requireSession(returnTo?: string) {
  const session = await getSession();
  if (!session) {
    redirect(
      returnTo ? `/login?redirect=${encodeURIComponent(returnTo)}` : "/login",
    );
  }
  return session;
}
