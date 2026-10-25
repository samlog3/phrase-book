// サーバー専用。Client Component から import するとビルドで落ちる
import "server-only";
import { hc } from "hono/client";
// 型だけを持ってくる。api のコードは web に入らない
import type { AppType } from "@phrase-book/api";
import { cookies } from "next/headers";
import { apiUrl } from "./env";

/**
 * ログイン中のユーザー用の api クライアント（Hono RPC）。
 * - ブラウザから届いた Cookie を api に転送する。web のサーバーから api を呼ぶときは Cookie が自動では付かないため
 * - 転送するのは cookie ヘッダーだけ（host などは api に送らない）
 * - リクエストごとに Cookie が違うので、呼ぶたびに作る
 * - 中で cookies() を読むので、<Suspense> の内側で呼ぶこと
 */
export async function getApiClient() {
  const cookie = (await cookies()).toString();
  return hc<AppType>(apiUrl, { headers: { cookie } });
}

/**
 * 公開画面用の api クライアント（Hono RPC）。Cookie は付けない。
 * - 誰が呼んでも同じなので、関数ではなく定数にしている
 * - cookies() を読まないので、<Suspense> の外でも使える
 */
export const publicApiClient = hc<AppType>(apiUrl);
