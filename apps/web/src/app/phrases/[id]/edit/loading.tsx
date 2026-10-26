import { PhraseFormHeading } from "@/components/phrases/phrase-form-heading";
import { PhraseFormSkeleton } from "@/components/phrases/phrase-form-skeleton";

/**
 * /phrases/[id]/edit へ移動する途中に表示する読み込み中の画面。
 * 置かないと親の /phrases/[id] の loading.tsx（詳細のスケルトン）が出るので、フォーム用のスケルトンで上書きする。
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <PhraseFormHeading>フレーズを編集</PhraseFormHeading>
      <PhraseFormSkeleton />
    </div>
  );
}
