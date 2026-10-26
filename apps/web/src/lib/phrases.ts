import "server-only";
import { notFound } from "next/navigation";
import { getApiClient, publicApiClient } from "./api-client";
import { requireSession } from "./session";

/**
 * URL の ID で自分のフレーズを api から取る。詳細と編集の画面で使う。
 * - 数字でない ID は、api に問い合わせる前に Not Found にする。URL から来た値を returnTo に使うのはその後だけにするため
 * - returnTo：セッションが切れていたときに、ログイン後に戻るパス（例: `/phrases/1/edit`）
 * - ないフレーズは notFound() で not-found.tsx に任せ、それ以外の失敗は投げて error.tsx に任せる
 * - 中で cookies() を読むので、<Suspense> の内側で呼ぶこと
 */
export async function getMyPhrase(id: string, returnTo: string) {
  if (!/^\d+$/.test(id)) notFound();
  await requireSession(returnTo);
  const client = await getApiClient();
  const res = await client.api.phrases[":id"].$get({ param: { id } });
  if (!res.ok) {
    // api は 404 などを AppError で投げて返すので、RPC の型には 200 しか載っていない。number として比べる
    const status: number = res.status;
    // 存在しない ID・他人のフレーズは 404、0 で始まる・大きすぎる ID は 400 が返る。どちらも「ないページ」として扱う
    if (status === 404 || status === 400) notFound();
    throw new Error(`phrase ${id} の取得に失敗しました: ${status}`);
  }
  return res.json();
}

/**
 * URL の ID で公開フレーズを api から取る。公開詳細の画面で使う。
 * - ログインは確かめず、Cookie なしの publicApiClient で呼ぶ
 * - 数字でない ID は、api に問い合わせる前に Not Found にする
 * - 存在しない ID と非公開のフレーズは、api がどちらも 404 を返すので区別しない
 * - ないフレーズは notFound() で not-found.tsx に任せ、それ以外の失敗は投げて error.tsx に任せる
 * - 中で fetch するので、<Suspense> の内側で呼ぶこと
 */
export async function getPublicPhrase(id: string) {
  if (!/^\d+$/.test(id)) notFound();
  const res = await publicApiClient.api.public.phrases[":id"].$get({
    param: { id },
  });
  if (!res.ok) {
    // getMyPhrase と同じく、RPC の型には 200 しか載っていないので number として比べる
    const status: number = res.status;
    if (status === 404 || status === 400) notFound();
    throw new Error(`public phrase ${id} の取得に失敗しました: ${status}`);
  }
  return res.json();
}
