import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/**
 * 一覧（/phrases）へ戻るリンク。詳細画面と Not Found 画面で使う。
 * Base UI の Button はボタンの意味を持つので、リンクには使わず見た目だけ buttonVariants で揃える。
 */
export function BackToListLink() {
  return (
    <Link
      href="/phrases"
      className={buttonVariants({
        variant: "ghost",
        size: "sm",
        className: "self-start",
      })}
    >
      <ArrowLeft aria-hidden />
      一覧に戻る
    </Link>
  );
}
