import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";

/**
 * Better Auth のインスタンス。メールアドレスとパスワードでの認証を提供する。
 * `app.ts` で `/api/auth/*` に `auth.handler` をマウントして使う。
 *
 * `BETTER_AUTH_SECRET` と `BETTER_AUTH_URL` は .env から自動で読まれる。
 * `BETTER_AUTH_URL` が API サーバーの URL と合っていないと、リクエストが 403 `INVALID_ORIGIN` になる。
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  emailAndPassword: {
    enabled: true,
  },
});
