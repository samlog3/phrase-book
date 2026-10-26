import { createPhraseSchema, type CreatePhraseInput } from "@phrase-book/shared";
import * as z from "zod";
import type { FieldErrorsOf } from "./field-errors";

export type PhraseFieldErrors = FieldErrorsOf<typeof createPhraseSchema>;

/**
 * 作成・編集の Server Action の戻り値で、フォームの状態にもなる（useActionState の state）。
 * - idle：まだ送っていない
 * - invalid：入力の誤り。項目ごとのメッセージを入力欄の下に出す
 * - error：想定外の失敗（api が落ちている、フレーズが消されていたなど）。フォームの上にまとめて出す
 * 成功したときは値を返さず、Server Action が redirect で詳細へ移動する。
 * 想定外の失敗も throw せずに返すのは、error.tsx に行くと入力した内容が消えてしまうため。
 */
export type PhraseFormState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: PhraseFieldErrors }
  | { status: "error"; message: string };

export const initialPhraseFormState: PhraseFormState = { status: "idle" };

/**
 * shared のスキーマは api と共有していて英語のメッセージのままなので、parse するときだけ日本語にする。
 * 項目名はメッセージに入れない（入力欄の下に出すので、どの項目かはわかる）。
 */
const phraseErrorMap: z.core.$ZodErrorMap = (issue) => {
  switch (issue.code) {
    case "too_small":
      return "入力してください";
    case "too_big":
      return `${issue.maximum}文字以内で入力してください`;
    case "invalid_format":
      // URL 以外の形式（メールアドレスなど）をスキーマに足したときに、URL の文が出ないようにする
      if (issue.format === "url") {
        return "http:// か https:// で始まる URL を入力してください";
      }
      return "入力内容が正しくありません";
    default:
      return "入力内容が正しくありません";
  }
};

/**
 * フォームの値を shared の createPhraseSchema で検証する。
 * ブラウザ（送る前に確かめる）と Server Action（外から直接呼ばれても確かめる）の両方で使う。
 * - 未入力の任意項目は "" で届き、スキーマが null に変える。編集では null が「空にする」になる
 * - フォームは全項目を送るので、編集でも createPhraseSchema で検証する（結果は PATCH にそのまま渡せる）
 * - isPublic のスイッチはオフだと値が送られないので、届いたかどうかで真偽値にする
 */
export function parsePhraseForm(
  formData: FormData,
):
  | { success: true; data: CreatePhraseInput }
  | { success: false; fieldErrors: PhraseFieldErrors } {
  const result = createPhraseSchema.safeParse(
    {
      phrase: formData.get("phrase"),
      meaning: formData.get("meaning"),
      example: formData.get("example"),
      context: formData.get("context"),
      note: formData.get("note"),
      source: formData.get("source"),
      sourceUrl: formData.get("sourceUrl"),
      isPublic: formData.get("isPublic") === "true",
    },
    { error: phraseErrorMap },
  );
  if (!result.success) {
    return {
      success: false,
      fieldErrors: z.flattenError(result.error).fieldErrors,
    };
  }
  return { success: true, data: result.data };
}
