/** エラーレスポンスの `code` の一覧。web と api で共有する。 */
export const ERROR_CODE = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

/** `ERROR_CODE` の値のユニオン型（`"VALIDATION_ERROR" | "UNAUTHORIZED" | ...`）。 */
export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];
