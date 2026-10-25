import { BackToListLink } from "@/components/phrases/back-to-list-link";

/**
 * page.tsx で notFound() を呼んだときの画面。存在しない ID と他人のフレーズの ID で表示される。
 * 他人のフレーズかどうかは区別せず、どちらも「見つからない」とだけ伝える。
 */
export default function PhraseNotFound() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <BackToListLink />
      <div className="flex flex-col gap-2 py-8 text-center">
        <h1 className="text-lg font-semibold sm:text-xl">
          フレーズが見つかりません
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          削除されたか、URL が間違っている可能性があります
        </p>
      </div>
    </div>
  );
}
