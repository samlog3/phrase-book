import { PhraseList } from "@/components/phrases/phrase-list";
import { PhraseListSkeleton } from "@/components/phrases/phrase-list-skeleton";
import { PublicPhrasesHeading } from "@/components/phrases/public-phrases-heading";
import { publicApiClient } from "@/lib/api-client";
import { Suspense } from "react";

/**
 * リクエストごとに決まる部分。公開フレーズの一覧を Cookie なしで api から取る。
 * - ログインは確かめない（requireSession は呼ばない）
 * - Cookie は読まないが、キャッシュしない fetch も <Suspense> の外で呼ぶとビルド時にエラーになるので、内側で呼ぶ。
 *   "use cache" で保存すると速くなるが、ビルド時に api が必要になり、書き込みの後にキャッシュを消す処理も増えるので、
 *   自分の一覧と同じくリクエストごとに取る
 * - api が失敗したら投げて error.tsx に任せる
 */
async function PublicPhrasesContent() {
  const res = await publicApiClient.api.public.phrases.$get();
  if (!res.ok) {
    throw new Error(`public phrases の取得に失敗しました: ${res.status}`);
  }
  const { items } = await res.json();
  return (
    <PhraseList
      items={items}
      basePath="/public"
      emptyMessage="公開されているフレーズはまだありません"
    />
  );
}

/**
 * 公開フレーズの一覧画面（/public）。ログインなしで開ける。
 * 静的な殻として見出しと <Suspense> だけを置き、一覧はリクエスト時に描画する。
 */
export default function PublicPhrasesPage() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <PublicPhrasesHeading />
      <Suspense fallback={<PhraseListSkeleton />}>
        <PublicPhrasesContent />
      </Suspense>
    </div>
  );
}
