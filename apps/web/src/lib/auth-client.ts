import { createAuthClient } from "better-auth/react";
import { apiUrl } from "./env";

/**
 * Better Auth のクライアント。サインアップ・ログイン・ログアウトとセッションの取得に使う。
 *
 * `baseURL` には web とは別オリジンの api を指定する。未指定だと web 自身（localhost:3000）に送ってしまう。
 * Cookie を送受信できるよう、リクエストには既定で `credentials: "include"` が付く。
 * そのため api 側の CORS でも `credentials: true` と origin の明示が必要になる。
 */
export const authClient = createAuthClient({
  baseURL: apiUrl,
});
