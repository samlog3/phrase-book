"use server";

import { getApiClient } from "@/lib/api-client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * 自分のフレーズを削除して、一覧へ戻る。
 * - 本人のフレーズかどうかは api が確かめるので、ここでは ID をそのまま渡す
 * - redirect は投げて処理を止めるので、一覧のデータを捨てる revalidatePath はその前に呼ぶ
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
  revalidatePath("/phrases");
  redirect("/phrases");
}
