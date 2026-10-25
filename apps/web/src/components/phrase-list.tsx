import type { PhraseListItem } from "@/lib/api-types";
import { PhraseListCard } from "./phrase-list-card";
import { PhraseListEmpty } from "./phrase-list-empty";

type PhraseListProps = {
  items: PhraseListItem[];
};

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
