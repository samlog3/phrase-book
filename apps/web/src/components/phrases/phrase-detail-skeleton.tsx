import { Skeleton } from "../ui/skeleton";

/**
 * 詳細の読み込み中に出す、カードの形をした灰色の枠。
 * page.tsx の <Suspense> の fallback と loading.tsx の両方で使う。
 */
export function PhraseDetailSkeleton() {
  return <Skeleton className="w-full rounded-xl h-86" />;
}
