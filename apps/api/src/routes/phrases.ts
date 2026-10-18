import { Hono } from "hono";
import {
  createPhrase,
  deletePhrase,
  getPhrase,
  listPhrases,
  updatePhrase,
} from "../services/phrases.js";
import { validator } from "../lib/validator.js";
import {
  createPhraseSchema,
  phraseIdParamSchema,
  updatePhraseSchema,
} from "@phrase-book/shared";

// RPC の型推論を効かせるため、メソッドはつなげて書き、ハンドラもその場で書く
const phrases = new Hono()
  .get("/", async (c) => {
    const result = await listPhrases();
    // ステップ5でページネーションの情報を足すため、配列をそのまま返さず { items } で包む
    return c.json({ items: result }, 200);
  })
  // バリデーションに失敗したら validator が AppError を投げ、ハンドラは実行されない
  .post("/", validator("json", createPhraseSchema), async (c) => {
    const input = c.req.valid("json");
    const phrase = await createPhrase(input);
    return c.json(phrase, 201);
  })
  // 存在しない ID のときは service が AppError（404）を投げるので、ここでは成功時だけ書く
  .get("/:id", validator("param", phraseIdParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const phrase = await getPhrase(id);
    return c.json(phrase, 200);
  })
  .patch(
    "/:id",
    // 並べた順に検証されるので、ID が不正ならボディを見る前に 400 になる
    validator("param", phraseIdParamSchema),
    validator("json", updatePhraseSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");
      const phrase = await updatePhrase(id, input);
      return c.json(phrase, 200);
    },
  )
  .delete("/:id", validator("param", phraseIdParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    await deletePhrase(id);
    // 204 はボディを持てないので、c.json ではなく c.body(null) で返す
    return c.body(null, 204);
  });

export default phrases;
