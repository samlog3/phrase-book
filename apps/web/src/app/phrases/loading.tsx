import { PhraseListSkeleton } from "@/components/phrases/phrase-list-skeleton";

/**
 * /phrases へ移動する途中に表示する読み込み中の画面。
 * page.tsx の <Suspense> の fallback と同じスケルトンを使い、切り替わったときの見た目をそろえる。
 */
export default function Loading() {
  return <PhraseListSkeleton />;
}
