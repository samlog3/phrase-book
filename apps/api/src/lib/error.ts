import type { ErrorCode } from "@phrase-book/shared";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * アプリで意図して投げるエラー。`app.onError` で `{ error: { code, message, details? } }` に変換される。
 *
 * @example
 * throw new AppError(404, ERROR_CODE.NOT_FOUND, "Not found");
 */
export class AppError extends Error {
  /**
   * @param status HTTP ステータス（レスポンスのステータス行になる。ボディには入れない）
   * @param code エラーの種類。クライアントはこれを見て処理を分ける
   * @param message 開発者向けの英語のメッセージ
   * @param details `VALIDATION_ERROR` のときだけ付ける（zod の `flattenError` の結果）
   */
  constructor(
    public status: ContentfulStatusCode,
    public code: ErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * エラーレスポンスのボディ `{ error: { code, message, details? } }` を作る。
 * `details` を渡さないときは、JSON にするときにキーごと消える。
 *
 * @param code エラーの種類
 * @param message 開発者向けの英語のメッセージ
 * @param details `VALIDATION_ERROR` のときだけ渡す
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown,
) {
  return { error: { code, message, details } };
}
