import { Skeleton } from "@/components/ui/skeleton";

/** 読み込み中に並べる枠の数 */
const SKELETON_COUNT = 5;

/**
 * 一覧の読み込み中に出す、カードの形をした灰色の枠。
 * - <ul> のクラスと枠の高さを PhraseList・PhraseListCard に合わせ、読み込みが終わったときの位置のずれを減らす
 * - page.tsx の <Suspense> の fallback と loading.tsx の両方で使う
 */
export function PhraseListSkeleton() {
  return (
    <ul className="flex flex-col gap-3 sm:gap-4">
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        // 並びが変わらない固定の枠なので、index を key にしてよい
        <li key={i}>
          <Skeleton className="h-28 w-full rounded-xl" />
        </li>
      ))}
    </ul>
  );
}
