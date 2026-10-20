import { createMiddleware } from "hono/factory";

import { ERROR_CODE } from "@phrase-book/shared";
import { auth } from "../lib/auth.js";
import { AppError } from "../lib/error.js";

type Env = {
  Variables: {
    user: typeof auth.$Infer.Session.user;
  };
};

/**
 * Cookie のセッションを検証するミドルウェア。セッションがなければ `UNAUTHORIZED`（401）の
 * `AppError` を投げ、あれば `user` を後続に渡す。
 * 401 はここで返すので、後続のハンドラでは `c.get("user")` が必ずある前提で書ける。
 *
 * @example
 * const phrases = new Hono()
 *   .use(sessionMiddleware)
 *   .get("/", (c) => {
 *     const user = c.get("user");
 *   });
 */
export const sessionMiddleware = createMiddleware<Env>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    throw new AppError(401, ERROR_CODE.UNAUTHORIZED, "Unauthorized");
  }
  c.set("user", session.user);

  await next();
});
