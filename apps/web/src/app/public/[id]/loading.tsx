import { BackToListLink } from "@/components/phrases/back-to-list-link";
import { PhraseDetailSkeleton } from "@/components/phrases/phrase-detail-skeleton";

/**
 * /public/[id] へ移動する途中に表示する読み込み中の画面。
 * - 置かないと親の /public の loading.tsx（一覧のスケルトン）が出るので、詳細用のスケルトンで上書きする
 * - page.tsx と同じく戻るリンクを置き、読み込みが終わったときにカードの位置がずれないようにする
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <BackToListLink href="/public" />
      <PhraseDetailSkeleton />
    </div>
  );
}
