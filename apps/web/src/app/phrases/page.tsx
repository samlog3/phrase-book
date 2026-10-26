import { NewPhraseLink } from "@/components/phrases/new-phrase-link";
import { PhraseList } from "@/components/phrases/phrase-list";
import { PhraseListSkeleton } from "@/components/phrases/phrase-list-skeleton";
import { getApiClient } from "@/lib/api-client";
import { requireSession } from "@/lib/session";
import { Suspense } from "react";

/**
 * リクエストごとに決まる部分。ログインを確認して、自分のフレーズ一覧を api から取る。
 * - requireSession と getApiClient は中で cookies() を読むため、必ず <Suspense> の内側で呼ぶ。
 *   外で呼ぶと、静的な殻を作るビルド時にエラーになる
 * - api が失敗したら投げて error.tsx に任せる
 */
async function PhrasesContent() {
  await requireSession("/phrases");
  const client = await getApiClient();
  const res = await client.api.phrases.$get();
  if (!res.ok) {
    throw new Error(`phrases の取得に失敗しました: ${res.status}`);
  }
  const { items } = await res.json();
  return (
    <PhraseList
      items={items}
      basePath="/phrases"
      emptyMessage="フレーズがまだありません"
    />
  );
}

/**
 * 自分のフレーズ一覧の画面（/phrases）。
 * 静的な殻として、ビルド時に作られる見出し・作成へのリンクと <Suspense> だけを置く。
 * <Suspense> の中身はリクエスト時に描画され、それまでは fallback のスケルトンが表示される。
 */
export default function PhrasesPage() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* 画面には出さず、スクリーンリーダー向けに見出しを残す */}
      <h1 className="sr-only">Phrases</h1>
      <NewPhraseLink className="self-end" />
      <Suspense fallback={<PhraseListSkeleton />}>
        <PhrasesContent />
      </Suspense>
    </div>
  );
}
