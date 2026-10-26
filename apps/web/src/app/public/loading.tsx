import { PhraseListSkeleton } from "@/components/phrases/phrase-list-skeleton";
import { PublicPhrasesHeading } from "@/components/phrases/public-phrases-heading";

/**
 * /public へ移動する途中に表示する読み込み中の画面。
 * page.tsx と同じ見出しとスケルトンを置き、切り替わったときの見た目をそろえる。
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <PublicPhrasesHeading />
      <PhraseListSkeleton />
    </div>
  );
}
