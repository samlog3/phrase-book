import { PhraseList } from "@/components/phrase-list";
import { PhraseListSkeleton } from "@/components/phrase-list-skeleton";
import { getApiClient } from "@/lib/api-client";
import { requireSession } from "@/lib/session";
import { Suspense } from "react";

// ログイン確認と、フレーズ一覧の取得
// requireSession は中で cookies() を読むため、必ず <Suspense> の内側で呼ぶ。
// 外で呼ぶと、静的な殻を作るビルド時にエラーになる。
async function PhrasesContent() {
  await requireSession("/phrases");
  const client = await getApiClient();
  const res = await client.api.phrases.$get();
  if (!res.ok) {
    throw new Error(`phrases の取得に失敗しました: ${res.status}`);
  }
  const { items } = await res.json();
  return <PhraseList items={items} />;
}

// 静的な殻。ビルド時に作られる見出しと <Suspense> だけを置く。
// <Suspense> の中身はリクエスト時に描画され、それまでは fallback が表示される。
export default function PhrasesPage() {
  return (
    <>
      <h1 className="sr-only">Phrases</h1>
      <Suspense fallback={<PhraseListSkeleton />}>
        <PhrasesContent />
      </Suspense>
    </>
  );
}
