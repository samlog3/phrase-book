import { NewPhraseLink } from "@/components/phrases/new-phrase-link";
import { PhraseListSkeleton } from "@/components/phrases/phrase-list-skeleton";

/**
 * /phrases へ移動する途中に表示する読み込み中の画面。
 * page.tsx の <Suspense> の fallback と同じスケルトンを使い、作成へのリンクも同じ位置に置いて、切り替わったときの見た目をそろえる。
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <NewPhraseLink />
      <PhraseListSkeleton />
    </div>
  );
}
