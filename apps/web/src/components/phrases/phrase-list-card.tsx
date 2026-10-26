import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PhraseListItem } from "@/lib/api-types";
import Link from "next/link";

type PhraseListCardProps = {
  // カードが表示に使う項目だけを受け取る。余分な項目があっても渡せるので、api の結果をそのまま渡してよい
  phrase: Pick<
    PhraseListItem,
    "id" | "phrase" | "meaning" | "example" | "isPublic"
  >;
  // 詳細画面のパス（/phrases/[id] か /public/[id]）
  href: string;
  // 公開中なら「公開」のバッジを出すか
  showPublicBadge: boolean;
};

/**
 * 一覧の 1 件分のカード。カード全体が詳細画面へのリンクになる。
 * - カードの中に別のリンクやボタンを置かないので、Link で Card を包むだけにしている
 * - 意味と例は 1 行で切り、カードの高さをそろえる
 */
export function PhraseListCard({
  phrase,
  href,
  showPublicBadge,
}: PhraseListCardProps) {
  return (
    <Link
      href={href}
      // Tab キーで移ったときに、どのカードにいるかがわかるよう枠を出す
      className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg lg:text-xl">
            {phrase.phrase}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base flex flex-col">
            <div className="line-clamp-1">意味： {phrase.meaning}</div>
            {/* example は任意項目なので、あるときだけ出す */}
            {phrase.example && (
              <div className="line-clamp-1">例　： {phrase.example}</div>
            )}
          </CardDescription>
          {showPublicBadge && phrase.isPublic && (
            <CardAction>
              <Badge>公開</Badge>
            </CardAction>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}
