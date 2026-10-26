import * as z from "zod";

// 前後の空白を除き、null・空文字（空白だけ含む）は null にする
const trimToNull = z
  .string()
  .nullable()
  .transform((v) => v?.trim() || null);

const nullableText = (max: number) =>
  trimToNull.pipe(z.string().max(max).nullable());

// 文字数の上限。スキーマとフォームの「○文字まで」の表示の両方で使う
export const PHRASE_MAX_LENGTH = {
  phrase: 100,
  meaning: 200,
  example: 200,
  context: 500,
  note: 800,
  source: 100,
  sourceUrl: 2048,
} as const;

const nullableUrl = trimToNull.pipe(
  z.httpUrl().max(PHRASE_MAX_LENGTH.sourceUrl).nullable(),
);

export const createPhraseSchema = z.object({
  phrase: z.string().trim().min(1).max(PHRASE_MAX_LENGTH.phrase),
  meaning: z.string().trim().min(1).max(PHRASE_MAX_LENGTH.meaning),
  example: nullableText(PHRASE_MAX_LENGTH.example).optional(),
  context: nullableText(PHRASE_MAX_LENGTH.context).optional(),
  note: nullableText(PHRASE_MAX_LENGTH.note).optional(),
  source: nullableText(PHRASE_MAX_LENGTH.source).optional(),
  sourceUrl: nullableUrl.optional(),
  // 真偽値のみ。null は空にする意味がないので受け付けない（省略時は作成なら非公開、更新なら変更しない）
  isPublic: z.boolean().optional(),
});

// キーがない → 変更しない、null → 空にする。phrase・meaning の null はエラー
export const updatePhraseSchema = createPhraseSchema.partial();

export const phraseIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9][0-9]*$/)
    .transform(Number)
    .pipe(z.number().max(2147483647)),
});

export type CreatePhraseInput = z.infer<typeof createPhraseSchema>;
export type UpdatePhraseInput = z.infer<typeof updatePhraseSchema>;
export type PhraseIdParam = z.infer<typeof phraseIdParamSchema>;
