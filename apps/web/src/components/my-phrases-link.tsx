"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";

/**
 * ヘッダーの「マイフレーズ」（/phrases）へのリンク。ログイン中だけ出す。
 * - ログイン状態は AuthButton と同じく useSession で見る。useSession は同じセッションを共有するので、api への問い合わせは増えない
 * - 取得中と未ログインのときは何も出さない。ログイン中は、出たときに後ろの「公開フレーズ」のリンクが少し右へずれる
 */
export function MyPhrasesLink() {
  const { data } = authClient.useSession();
  if (!data) return null;

  return (
    <Link
      href="/phrases"
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      マイフレーズ
    </Link>
  );
}
