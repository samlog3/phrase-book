import { PhraseDetailNav } from "@/components/phrases/phrase-detail-nav";
import { PhraseDetailCard } from "@/components/phrases/phrase-detail-card";
import { PhraseDetailSkeleton } from "@/components/phrases/phrase-detail-skeleton";
import { getMyPhrase } from "@/lib/phrases";
import { Suspense } from "react";

type PhraseDetailProps = {
  params: Promise<{ id: string }>;
};

/**
 * 自分のフレーズの詳細画面（/phrases/[id]）。
 * 一覧へ戻るリンクと作成へのリンクは静的な殻に置き、params を使う部分だけを <Suspense> の中でリクエスト時に描画する。
 * params はリクエストごとに決まるので、ここでは await せず Promise のまま渡す。
 */
export default function PhraseDetailPage({ params }: PhraseDetailProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <PhraseDetailNav />
      <Suspense fallback={<PhraseDetailSkeleton />}>
        <PhraseDetailContent params={params} />
      </Suspense>
    </div>
  );
}

/**
 * リクエストごとに決まる部分。ログインを確認して、ID のフレーズを api から取る。
 * ないフレーズのときの Not Found は getMyPhrase に任せる。
 */
async function PhraseDetailContent({ params }: PhraseDetailProps) {
  const { id } = await params;
  const phrase = await getMyPhrase(id, `/phrases/${id}`);
  return <PhraseDetailCard phrase={phrase} />;
}
