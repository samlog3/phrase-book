import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

type NewPhraseLinkProps = {
  /** 置く場所での位置（例: 一覧では右に寄せる self-end） */
  className?: string;
};

/**
 * 作成画面（/phrases/new）へのリンク。一覧と詳細の page.tsx・loading.tsx に置き、読み込みの前後で位置をそろえる。
 * Base UI の Button はボタンの意味を持つので、リンクには使わず見た目だけ buttonVariants で揃える。
 */
export function NewPhraseLink({ className }: NewPhraseLinkProps) {
  return (
    <Link href="/phrases/new" className={buttonVariants({ className })}>
      <Plus aria-hidden />
      新規作成
    </Link>
  );
}
