import * as z from "zod";

// 前後の空白を除き、null・空文字（空白だけ含む）は null にする
const trimToNull = z
  .string()
  .nullable()
  .transform((v) => v?.trim() || null);

const nullableText = (max: number) =>
  trimToNull.pipe(z.string().max(max).nullable());

const nullableUrl = trimToNull.pipe(z.httpUrl().max(2048).nullable());

export const createPhrase = z.object({
  phrase: z.string().trim().min(1).max(100),
  meaning: z.string().trim().min(1).max(200),
  example: nullableText(200).optional(),
  context: nullableText(500).optional(),
  note: nullableText(800).optional(),
  source: nullableText(100).optional(),
  sourceUrl: nullableUrl.optional(),
});

// キーがない → 変更しない、null → 空にする。phrase・meaning の null はエラー
export const updatePhrase = createPhrase.partial();

export const phraseIdParam = z.object({
  id: z
    .string()
    .regex(/^[1-9][0-9]*$/)
    .transform(Number)
    .pipe(z.number().max(2147483647)),
});

export type CreatePhraseInput = z.infer<typeof createPhrase>;
export type UpdatePhraseInput = z.infer<typeof updatePhrase>;
export type PhraseIdParam = z.infer<typeof phraseIdParam>;
