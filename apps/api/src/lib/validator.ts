import { zValidator } from "@hono/zod-validator";
import { ERROR_CODE } from "@phrase-book/shared";
import type { ValidationTargets } from "hono";
import * as z from "zod";
import { AppError } from "./error.js";

/**
 * `zValidator` のラッパー。バリデーションに失敗したら `VALIDATION_ERROR`（400）の
 * `AppError` を投げ、`app.onError` でレスポンスにする。
 *
 * @example
 * app.post("/", validator("json", createPhrase), (c) => {
 *   const body = c.req.valid("json");
 * });
 */
export const validator = <
  T extends z.ZodType,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T,
) =>
  zValidator(target, schema, (result) => {
    if (!result.success) {
      throw new AppError(
        400,
        ERROR_CODE.VALIDATION_ERROR,
        "Invalid request",
        z.flattenError(result.error),
      );
    }
  });
