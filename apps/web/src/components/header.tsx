import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { MyPhrasesLink } from "@/components/my-phrases-link";

/**
 * 全画面共通のヘッダー。左にトップ・公開一覧・自分の一覧へのリンク、右にログイン状態を出す。
 * - 公開一覧はログインなしで見られるので、ログイン状態に関係なくリンクを出す
 * - 自分の一覧へのリンクはログイン中だけ出すので、その部分だけ Client Component（MyPhrasesLink）にする
 */
export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-4">
          <Link href="/" className="font-semibold">
            Phrase Book
          </Link>
          <MyPhrasesLink />
          <Link
            href="/public"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            公開フレーズ
          </Link>
        </nav>
        <AuthButton />
      </div>
    </header>
  );
}
