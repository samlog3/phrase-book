import { PhraseFormHeading } from "@/components/phrases/phrase-form-heading";
import { PhraseFormSkeleton } from "@/components/phrases/phrase-form-skeleton";

/**
 * /phrases/new へ移動する途中に表示する読み込み中の画面。
 * 置かないと親の /phrases の loading.tsx（一覧のスケルトン）が出るので、フォーム用のスケルトンで上書きする。
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <PhraseFormHeading>フレーズを作成</PhraseFormHeading>
      <PhraseFormSkeleton />
    </div>
  );
}
