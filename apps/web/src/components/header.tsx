import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { MyPhrasesLink } from "@/components/my-phrases-link";

/**
 * 全画面共通のヘッダー。左にトップ・公開一覧・自分の一覧へのリンク、右にログイン状態を出す。
 * - 公開一覧はログインなしで見られるので、ログイン状態に関係なくリンクを出す
 * - 自分の一覧へのリンクはログイン中だけ出すので、その部分だけ Client Component（MyPhrasesLink）にする
 * - スマホの幅では 1 行に収まらないので、リンクを 1 段目、ログイン状態を 2 段目（右寄せ）に分ける。sm 以上では 1 行に並べる
 */
export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-4xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
        {/* 2 段目のときも右に寄せる。min-w-0 は、長いメールアドレスを truncate で切れるようにするため */}
        <div className="flex min-w-0 justify-end">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
