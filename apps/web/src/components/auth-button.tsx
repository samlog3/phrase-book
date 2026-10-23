"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

/**
 * ヘッダー右側のログイン状態の表示。未ログインならログイン・会員登録へのリンク、ログイン中ならメールアドレスとログアウトボタンを出す。
 * `useSession` はセッションを api から取得し、ログアウト後は自動で取り直すので、表示もそれに合わせて切り替わる。
 */
export function AuthButton() {
  const { data, isPending } = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);

  // 取得中はログイン状態がわからないので中身は出さない。高さだけ確保して、表示が切り替わるときのずれを抑える
  if (isPending) return <div className="h-8" aria-hidden />;

  if (!data) {
    // Base UI の Button はボタンの意味（role="button" など）を持つので、リンクには使わない。見た目だけ buttonVariants で揃える
    return (
      <div className="flex gap-2">
        <Link href="/login" className={buttonVariants({ variant: "outline" })}>
          ログイン
        </Link>
        <Link href="/signup" className={buttonVariants()}>
          会員登録
        </Link>
      </div>
    );
  }

  async function onClick() {
    setSigningOut(true);
    try {
      // signOut は失敗しても例外を投げず error を返す。ネットワークエラーのときだけ例外になる
      const { error } = await authClient.signOut();
      if (error) console.error("ログアウトに失敗しました", error);
    } catch (error) {
      console.error("ログアウトに失敗しました", error);
    } finally {
      // 戻るボタンでキャッシュから保護画面が表示されないよう、ページごと読み込み直す。
      // router.push だと Client Cache が残り、Proxy を通らない
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <p className="text-sm text-muted-foreground">{data.user.email}</p>
      <Button variant="outline" onClick={onClick} disabled={signingOut}>
        ログアウト
      </Button>
    </div>
  );
}
