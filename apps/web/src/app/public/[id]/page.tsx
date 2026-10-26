import { BackToListLink } from "@/components/phrases/back-to-list-link";
import { PhraseDetailCard } from "@/components/phrases/phrase-detail-card";
import { PhraseDetailSkeleton } from "@/components/phrases/phrase-detail-skeleton";
import { getPublicPhrase } from "@/lib/phrases";
import { Suspense } from "react";

type PublicPhraseDetailProps = {
  params: Promise<{ id: string }>;
};

/**
 * 公開フレーズの詳細画面（/public/[id]）。ログインなしで開ける。
 * 一覧へ戻るリンクは静的な殻に置き、params を使う部分だけを <Suspense> の中でリクエスト時に描画する。
 */
export default function PublicPhraseDetailPage({
  params,
}: PublicPhraseDetailProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <BackToListLink href="/public" />
      <Suspense fallback={<PhraseDetailSkeleton />}>
        <PublicPhraseDetailContent params={params} />
      </Suspense>
    </div>
  );
}

/**
 * リクエストごとに決まる部分。ID の公開フレーズを api から取る。
 * - 存在しない・非公開のときの Not Found は getPublicPhrase に任せる
 * - 自分のフレーズでも、ここでは編集・削除を出さない（それは /phrases/[id] の役割）
 */
async function PublicPhraseDetailContent({ params }: PublicPhraseDetailProps) {
  const { id } = await params;
  const phrase = await getPublicPhrase(id);
  return <PhraseDetailCard phrase={phrase} showPublicBadge={false} />;
}
