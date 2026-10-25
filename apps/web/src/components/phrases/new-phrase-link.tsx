import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/**
 * 作成画面（/phrases/new）へのリンク。一覧の page.tsx と loading.tsx の両方に置き、読み込みの前後で位置をそろえる。
 * Base UI の Button はボタンの意味を持つので、リンクには使わず見た目だけ buttonVariants で揃える。
 */
export function NewPhraseLink() {
  return (
    <Link
      href="/phrases/new"
      className={buttonVariants({ className: "self-end" })}
    >
      <Plus aria-hidden />
      新規作成
    </Link>
  );
}
