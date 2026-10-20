import { Hono } from "hono";
import phrases from "./routes/phrases.js";
import { auth } from "./lib/auth.js";
import { AppError, errorResponse } from "./lib/error.js";
import { ERROR_CODE } from "@phrase-book/shared";
import { HTTPException } from "hono/http-exception";
import { cors } from "hono/cors";
import { webOrigin } from "./lib/env.js";
import publicPhrases from "./routes/publicPhrases.js";

/**
 * API 全体の Hono アプリ。ルートは `/api/auth/*`（Better Auth）、`/api/phrases`、`/api/public/phrases` に分かれる。
 * `/api/phrases` はログイン必須で、認証のミドルウェアは phrases ルーターの中でかけている。
 * `/api/public/phrases` はログイン不要で、認証のミドルウェアをかけない。
 */
const app = new Hono()
  // フロントからの Cookie 付きリクエストを受けるため、origin を明示して credentials を許可する。
  // ルートより先に登録して、プリフライト（OPTIONS）にもここで応答する
  .use(
    "/api/*",
    cors({
      origin: webOrigin,
      allowHeaders: ["Content-Type"],
      allowMethods: ["POST", "GET", "PATCH", "DELETE"],
      credentials: true,
    }),
  )
  // サインアップ・ログイン・ログアウトなどは Better Auth が処理する。
  // Better Auth のエラーは `{ message, code }` の形で返り、アプリ共通の `{ error: { code, message } }` とは異なる
  .on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .route("/api/phrases", phrases)
  .route("/api/public/phrases", publicPhrases)
  .get("/", (c) => {
    return c.text("Hello Hono!");
  });

app.notFound((c) => {
  return c.json(errorResponse(ERROR_CODE.NOT_FOUND, "Not found"), 404);
});

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(
      errorResponse(err.code, err.message, err.details),
      err.status,
    );
  }
  // Hono 本体やミドルウェアが投げる HTTPException のうち、仕様にあるコードに対応づけられるもの
  if (err instanceof HTTPException && err.status === 400) {
    return c.json(
      errorResponse(ERROR_CODE.VALIDATION_ERROR, "Invalid request", {
        // メッセージなしで投げられることもある（bearerAuth など）ので、空なら入れない
        formErrors: err.message ? [err.message] : [],
        fieldErrors: {},
      }),
      400,
    );
  }
  if (err instanceof HTTPException && err.status === 401) {
    return c.json(errorResponse(ERROR_CODE.UNAUTHORIZED, "Unauthorized"), 401);
  }
  // 上のどれにも当てはまらないものは想定外のエラーとして扱う
  console.error(err);
  return c.json(
    errorResponse(ERROR_CODE.INTERNAL_ERROR, "Internal server error"),
    500,
  );
});

export default app;
/** フロントエンドの Hono RPC クライアント（`hc<AppType>`）に渡す、API の型 */
export type AppType = typeof app;
