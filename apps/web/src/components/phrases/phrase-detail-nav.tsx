import { BackToListLink } from "./back-to-list-link";
import { NewPhraseLink } from "./new-phrase-link";

/**
 * 詳細画面の上に置く、一覧へ戻るリンク（左）と作成へのリンク（右）。
 * 詳細の page.tsx と loading.tsx の両方に置き、読み込みの前後で位置をそろえる。
 */
export function PhraseDetailNav() {
  return (
    <div className="flex items-start justify-between">
      <BackToListLink />
      <NewPhraseLink />
    </div>
  );
}
