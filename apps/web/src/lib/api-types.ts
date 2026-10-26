import type { InferResponseType } from "hono/client";
// 型だけを使う。server-only の api-client を実行時に読み込まないよう import type にする
import type { getApiClient } from "./api-client";

type ApiClient = Awaited<ReturnType<typeof getApiClient>>;
type PublicPhrasesClient = ApiClient["api"]["public"]["phrases"];

/** 自分のフレーズ一覧（GET /api/phrases）の 1 件 */
export type PhraseListItem = InferResponseType<
  ApiClient["api"]["phrases"]["$get"],
  200
>["items"][number];

/** 自分のフレーズ 1 件（GET /api/phrases/:id）。一覧と違い { items } で包まず、フレーズがそのまま返る */
export type PhraseDetail = InferResponseType<
  ApiClient["api"]["phrases"][":id"]["$get"],
  200
>;

/** 公開フレーズ一覧（GET /api/public/phrases）の 1 件。`note` と `userId` は含まれない */
export type PublicPhraseListItem = InferResponseType<
  PublicPhrasesClient["$get"],
  200
>["items"][number];

/** 公開フレーズ 1 件（GET /api/public/phrases/:id）。`note` と `userId` は含まれない */
export type PublicPhraseDetail = InferResponseType<
  PublicPhrasesClient[":id"]["$get"],
  200
>;
