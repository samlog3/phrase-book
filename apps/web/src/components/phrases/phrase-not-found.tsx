import { BackToListLink } from "./back-to-list-link";

type PhraseNotFoundProps = {
  // 戻る先の一覧
  backHref: "/phrases" | "/public";
};

/**
 * フレーズが見つからないときの表示。/phrases/[id] と /public/[id] の not-found.tsx で使う。
 * 他人のフレーズ・非公開のフレーズかどうかは区別せず、どれも「見つからない」とだけ伝える。
 */
export function PhraseNotFound({ backHref }: PhraseNotFoundProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <BackToListLink href={backHref} />
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
