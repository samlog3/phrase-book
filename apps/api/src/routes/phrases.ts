import { Hono } from "hono";
import { createPhrase, listPhrases } from "../services/phrases.js";
import { validator } from "../lib/validator.js";
import { createPhraseSchema } from "@phrase-book/shared";

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
  });

export default phrases;
