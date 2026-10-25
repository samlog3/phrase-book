import { Skeleton } from "@/components/ui/skeleton";

/**
 * 作成・編集の読み込み中に出す、フォームのカードの形をした灰色の枠。
 * page.tsx の <Suspense> の fallback と loading.tsx の両方で使う。
 */
export function PhraseFormSkeleton() {
  return <Skeleton className="h-200 w-full rounded-xl" />;
}
