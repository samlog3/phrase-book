import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

type BackToListLinkProps = {
  // 戻る先の一覧。自分の画面は /phrases、公開画面は /public
  href: "/phrases" | "/public";
};

/**
 * 一覧へ戻るリンク。詳細画面と Not Found 画面で使う。
 * Base UI の Button はボタンの意味を持つので、リンクには使わず見た目だけ buttonVariants で揃える。
 */
export function BackToListLink({ href }: BackToListLinkProps) {
  return (
    <Link
      href={href}
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
