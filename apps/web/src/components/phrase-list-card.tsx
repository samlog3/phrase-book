import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import type { PhraseListItem } from "@/lib/api-types";
import Link from "next/link";

type PhraseListCardProps = {
  phrase: Pick<
    PhraseListItem,
    "id" | "phrase" | "meaning" | "example" | "isPublic"
  >;
};

export function PhraseListCard({ phrase }: PhraseListCardProps) {
  return (
    <Link
      href={`/phrases/${phrase.id}`}
      className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg lg:text-xl">
            {phrase.phrase}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base flex flex-col">
            <div className="line-clamp-1">意味： {phrase.meaning}</div>
            {phrase.example && (
              <div className="line-clamp-1">例　： {phrase.example}</div>
            )}
          </CardDescription>
          {phrase.isPublic && (
            <CardAction>
              <Badge>公開</Badge>
            </CardAction>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}
