"use server";

import { getApiClient } from "@/lib/api-client";
import {
  parsePhraseForm,
  type PhraseFieldErrors,
  type PhraseFormState,
} from "@/lib/schemas/phrase";
import {
  createPhraseSchema,
  ERROR_CODE,
  phraseIdParamSchema,
} from "@phrase-book/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";

/**
 * フレーズを作成して、作ったフレーズの詳細へ移動する。useActionState から呼ぶ。
 * - ブラウザでも検証しているが、Server Action は外から直接呼べるので、ここでも同じ関数で検証する
 * - 入力の誤りと想定外の失敗は PhraseFormState で返し、フォームに表示する。成功したときだけ redirect する
 */
export async function createPhrase(
  _prevState: PhraseFormState,
  formData: FormData,
): Promise<PhraseFormState> {
  const result = parsePhraseForm(formData);
  if (!result.success) {
    return { status: "invalid", fieldErrors: result.fieldErrors };
  }

  const client = await getApiClient();
  let res;
  try {
    res = await client.api.phrases.$post({ json: result.data });
  } catch (error) {
    // api に届かなかったとき（api が起動していないなど）
    console.error(error);
    return SAVE_FAILED;
  }
  if (!res.ok) return handleSaveError(res, "/phrases/new");

  const phrase = await res.json();
  revalidatePhrases();
  redirect(`/phrases/${phrase.id}`);
}

/**
 * 自分のフレーズを更新して、詳細へ戻る。編集画面で `updatePhrase.bind(null, id)` にして渡す。
 * - id は bind で埋めるが、ブラウザから送られてくる値なので、使う前に確かめる
 * - フォームは全項目を送るので、空にした任意項目は null として送られ、api で空になる
 */
export async function updatePhrase(
  id: number,
  _prevState: PhraseFormState,
  formData: FormData,
): Promise<PhraseFormState> {
  const idResult = phraseIdParamSchema.safeParse({ id: String(id) });
  if (!idResult.success) return PHRASE_NOT_FOUND;
  const phraseId = idResult.data.id;

  const result = parsePhraseForm(formData);
  if (!result.success) {
    return { status: "invalid", fieldErrors: result.fieldErrors };
  }

  const client = await getApiClient();
  let res;
  try {
    res = await client.api.phrases[":id"].$patch({
      param: { id: String(phraseId) },
      json: result.data,
    });
  } catch (error) {
    console.error(error);
    return SAVE_FAILED;
  }
  if (!res.ok) return handleSaveError(res, `/phrases/${phraseId}/edit`);

  revalidatePhrases();
  redirect(`/phrases/${phraseId}`);
}

/**
 * 自分のフレーズを削除して、一覧へ戻る。
 * - 本人のフレーズかどうかは api が確かめるので、ここでは ID をそのまま渡す
 * - redirect は投げて処理を止めるので、/phrases 以下の画面を取り直す revalidatePhrases はその前に呼ぶ
 * - 詳細画面を開いている間にセッションが切れていたら、ログイン後に詳細へ戻れるよう /login へ移動する
 * - それ以外の失敗は投げて error.tsx に任せる
 */
export async function deletePhrase(id: number) {
  const client = await getApiClient();
  const res = await client.api.phrases[":id"].$delete({
    param: { id: String(id) },
  });
  if (!res.ok) {
    // api は 404 などを AppError で投げて返すので、RPC の型には 204 しか載っていない。number として比べる
    const status: number = res.status;
    if (status === 401) {
      redirect(`/login?redirect=${encodeURIComponent(`/phrases/${id}`)}`);
    }
    // 別のタブで先に削除していたなど、すでにないときは削除できたものとして一覧へ戻す
    if (status !== 404) {
      throw new Error(`phrase ${id} の削除に失敗しました: ${status}`);
    }
  }
  revalidatePhrases();
  redirect("/phrases");
}

const SAVE_FAILED: PhraseFormState = {
  status: "error",
  message: "保存できませんでした。時間をおいてもう一度お試しください",
};

const PHRASE_NOT_FOUND: PhraseFormState = {
  status: "error",
  message: "フレーズが見つかりません。削除された可能性があります",
};

/**
 * 作成・更新・削除の結果を一覧・詳細・編集の画面に反映する。redirect の前に呼ぶこと。
 * - 一覧や詳細のデータは "use cache" で保存していないので、updateTag で消すキャッシュはない
 * - refresh() は今いる画面（作成・編集）しか取り直さないので、前に開いた一覧や詳細が古いまま残る
 * - revalidatePath を /phrases の layout で呼ぶと、/phrases 以下の画面をまとめて取り直す
 */
function revalidatePhrases() {
  revalidatePath("/phrases", "layout");
}

// api の 400 のボディ（{ error: { code, message, details } }）のうち、使うところだけ
const apiValidationErrorSchema = z.object({
  error: z.object({
    code: z.literal(ERROR_CODE.VALIDATION_ERROR),
    details: z.object({
      fieldErrors: z.record(z.string(), z.array(z.string()).optional()),
    }),
  }),
});

/**
 * 作成・更新で api が失敗したときに、フォームに返す値を決める。
 * - 401：入力中にセッションが切れた。ログイン後にこのフォームへ戻れるよう /login へ移動する
 * - 400：ブラウザとここで検証しているので普通は起きないが、起きたら項目ごとに表示する。
 *   api のメッセージは開発者向けの英語なので、画面には日本語の決まった文を出す
 * - 404：更新しようとしたフレーズが、別のタブで削除されていたなど
 * - それ以外：入力を消さないよう throw せず、想定外の失敗として返す
 */
async function handleSaveError(
  res: { status: number; json(): Promise<unknown> },
  returnTo: string,
): Promise<PhraseFormState> {
  if (res.status === 401) {
    redirect(`/login?redirect=${encodeURIComponent(returnTo)}`);
  }
  if (res.status === 400) {
    const fieldErrors = toPhraseFieldErrors(await res.json().catch(() => null));
    if (fieldErrors) return { status: "invalid", fieldErrors };
  }
  if (res.status === 404) return PHRASE_NOT_FOUND;

  console.error(`phrase の保存に失敗しました: ${res.status}`);
  return SAVE_FAILED;
}

/** api の 400 のボディから、フォームにある項目のエラーだけを取り出す。1 つもなければ null。 */
function toPhraseFieldErrors(body: unknown): PhraseFieldErrors | null {
  const parsed = apiValidationErrorSchema.safeParse(body);
  if (!parsed.success) return null;

  const fieldErrors: PhraseFieldErrors = {};
  for (const key of Object.keys(parsed.data.error.details.fieldErrors)) {
    if (key in createPhraseSchema.shape) {
      fieldErrors[key as keyof PhraseFieldErrors] = [
        "入力内容が正しくありません",
      ];
    }
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}
