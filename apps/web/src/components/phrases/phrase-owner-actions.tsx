import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PhraseDeleteButton } from "./phrase-delete-button";

type PhraseOwnerActionsProps = {
  id: number;
  phrase: string;
};

/**
 * 自分の詳細画面（/phrases/[id]）のカードの下に置く、編集へのリンクと削除ボタン。
 * 公開詳細（/public/[id]）では出さないので、PhraseDetailCard の actions に渡して使う。
 */
export function PhraseOwnerActions({ id, phrase }: PhraseOwnerActionsProps) {
  return (
    <>
      <Link
        href={`/phrases/${id}/edit`}
        // outline の枠（--border）は白いカードの上だと薄くて見えにくいので、文字色を薄めた色で濃くする。
        // cn は後に書いたクラスを優先するので、border-border を上書きできる
        className={cn(
          buttonVariants({ variant: "outline" }),
          "border-foreground/20",
        )}
      >
        編集
      </Link>
      <PhraseDeleteButton id={id} phrase={phrase} />
    </>
  );
}
