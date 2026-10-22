import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";
import { webOrigin } from "./env.js";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@phrase-book/shared";

/**
 * Better Auth のインスタンス。メールアドレスとパスワードでの認証を提供する。
 * `app.ts` で `/api/auth/*` に `auth.handler` をマウントして使う。
 *
 * `BETTER_AUTH_SECRET` と `BETTER_AUTH_URL` は .env から自動で読まれる。
 * `BETTER_AUTH_URL` が API サーバーの URL と合っていないと、リクエストが 403 `INVALID_ORIGIN` になる。
 *
 * `trustedOrigins` は CSRF 対策で、Cookie 付きのリクエストの Origin がここになければ 403 `INVALID_ORIGIN` になる。
 * Hono の CORS とは別の仕組みなので、`app.ts` の CORS の `origin` と同じ値を入れる。
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
  },
  trustedOrigins: [webOrigin],
});
