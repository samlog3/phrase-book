import { BackToListLink } from "@/components/phrases/back-to-list-link";
import { PhraseDetailCard } from "@/components/phrases/phrase-detail-card";
import { PhraseDetailSkeleton } from "@/components/phrases/phrase-detail-skeleton";
import { getApiClient } from "@/lib/api-client";
import { requireSession } from "@/lib/session";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type PhraseDetailProps = {
  params: Promise<{ id: string }>;
};

/**
 * 自分のフレーズの詳細画面（/phrases/[id]）。
 * 一覧へ戻るリンクは静的な殻に置き、params を使う部分だけを <Suspense> の中でリクエスト時に描画する。
 * params はリクエストごとに決まるので、ここでは await せず Promise のまま渡す。
 */
export default function PhraseDetailPage({ params }: PhraseDetailProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <BackToListLink />
      <Suspense fallback={<PhraseDetailSkeleton />}>
        <PhraseDetailContent params={params} />
      </Suspense>
    </div>
  );
}

/**
 * リクエストごとに決まる部分。ログインを確認して、ID のフレーズを api から取る。
 * - ないフレーズは notFound() で not-found.tsx に任せ、それ以外の失敗は投げて error.tsx に任せる
 */
async function PhraseDetailContent({ params }: PhraseDetailProps) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound(); // 数字でなければ、ここで Not Found にする
  await requireSession(`/phrases/${id}`);
  const client = await getApiClient();
  const res = await client.api.phrases[":id"].$get({ param: { id } });
  if (!res.ok) {
    // api は 404 などを AppError で投げて返すので、RPC の型には 200 しか載っていない。number として比べる
    const status: number = res.status;
    // 存在しない ID・他人のフレーズは 404、0 で始まる・大きすぎる ID は 400 が返る。どちらも「ないページ」として扱う
    if (status === 404 || status === 400) notFound();
    throw new Error(`phrase ${id} の取得に失敗しました: ${status}`);
  }
  const phrase = await res.json();
  return <PhraseDetailCard phrase={phrase} />;
}
