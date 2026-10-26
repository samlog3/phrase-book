import type { ComponentProps } from "react";
import { PhraseListCard } from "./phrase-list-card";
import { PhraseListEmpty } from "./phrase-list-empty";

type PhraseListProps = {
  // カードが使う項目だけを受け取る。自分用の api の結果も、公開用の api の結果（note がない）も渡せる
  items: ComponentProps<typeof PhraseListCard>["phrase"][];
  // 詳細画面のパスの頭。自分の一覧は /phrases、公開一覧は /public
  basePath: "/phrases" | "/public";
  // 0 件のときに出す文
  emptyMessage: string;
  // 公開中なら「公開」のバッジを出すか。公開一覧はすべて公開なので出さない
  showPublicBadge: boolean;
};

/**
 * フレーズを渡された順に縦に並べる。0 件なら PhraseListEmpty を出す。
 * データは props で受け取るだけで api は呼ばない。幅と余白は layout.tsx に任せ、ここでは並べ方だけを決める。
 */
export function PhraseList({
  items,
  basePath,
  emptyMessage,
  showPublicBadge,
}: PhraseListProps) {
  if (items.length === 0) return <PhraseListEmpty message={emptyMessage} />;

  return (
    <ul className="flex flex-col gap-3 sm:gap-4">
      {items.map((item) => (
        <li key={item.id}>
          <PhraseListCard
            phrase={item}
            href={`${basePath}/${item.id}`}
            showPublicBadge={showPublicBadge}
          />
        </li>
      ))}
    </ul>
  );
}
