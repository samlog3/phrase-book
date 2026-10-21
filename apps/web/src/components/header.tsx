import Link from "next/link";
import { AuthButton } from "@/components/auth-button";

/** 全画面共通のヘッダー。左にトップへのリンク、右にログイン状態を出す */
export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          Phrase Book
        </Link>
        <AuthButton />
      </div>
    </header>
  );
}
