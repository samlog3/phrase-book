import type { PhraseListItem } from "@/lib/api-types";
import { PhraseListCard } from "./phrase-list-card";
import { PhraseListEmpty } from "./phrase-list-empty";

type PhraseListProps = {
  items: PhraseListItem[];
};

/**
 * フレーズを渡された順に縦に並べる。0 件なら PhraseListEmpty を出す。
 * データは props で受け取るだけで api は呼ばない。幅と余白は layout.tsx に任せ、ここでは並べ方だけを決める。
 */
export function PhraseList({ items }: PhraseListProps) {
  if (items.length === 0) return <PhraseListEmpty />;

  return (
    <ul className="flex flex-col gap-3 sm:gap-4">
      {items.map((item) => (
        <li key={item.id}>
          <PhraseListCard phrase={item} />
        </li>
      ))}
    </ul>
  );
}
