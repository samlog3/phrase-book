"use client";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

/**
 * ログイン状態の表示。未ログインならログイン・サインアップへのリンク、ログイン中ならメールアドレスとログアウトボタンを出す。
 * `useSession` はセッションを api から取得し、ログアウト後は自動で取り直すので、表示もそれに合わせて切り替わる。
 */
export function AuthButton() {
  const { data, isPending } = authClient.useSession();

  // 取得中はログイン状態がわからないので、どちらの表示も出さない
  if (isPending) return null;

  if (!data) {
    return (
      <div>
        <Link href="/login">Login</Link>
        <Link href="/signup">Sign up</Link>
      </div>
    );
  }

  return (
    <div>
      <p>{data.user.email}</p>
      <Button onClick={() => authClient.signOut()}>Logout</Button>
    </div>
  );
}
