import { Hono } from "hono";
import {
  getPublicPhrase,
  listPublicPhrases,
} from "../services/publicPhrases.js";

import { phraseIdParamSchema } from "@phrase-book/shared";
import { validator } from "../lib/validator.js";

// ログイン不要の公開用ルーター。sessionMiddleware はかけない（かけると未ログインで 401 になる）
// RPC の型推論を効かせるため、メソッドはつなげて書き、ハンドラもその場で書く
const publicPhrases = new Hono()
  .get("/", async (c) => {
    const result = await listPublicPhrases();
    // 自分用の一覧と同じく、{ items } で包んで返す
    return c.json({ items: result }, 200);
  })
  // 存在しない ID や非公開のフレーズのときは service が AppError（404）を投げるので、ここでは成功時だけ書く
  .get("/:id", validator("param", phraseIdParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const phrase = await getPublicPhrase(id);
    return c.json(phrase, 200);
  });

export default publicPhrases;
