import type { InferResponseType } from "hono/client";
// 型だけを使う。server-only の api-client を実行時に読み込まないよう import type にする
import type { getApiClient } from "./api-client";

type ApiClient = Awaited<ReturnType<typeof getApiClient>>;

/** 自分のフレーズ一覧（GET /api/phrases）の 1 件 */
export type PhraseListItem = InferResponseType<
  ApiClient["api"]["phrases"]["$get"],
  200
>["items"][number];
