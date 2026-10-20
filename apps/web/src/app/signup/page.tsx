"use client";
import { SignupForm } from "@/components/signup-form";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

/**
 * サインアップ画面。CORS と Cookie の確認用の暫定実装で、ステップ6で作り直す。
 * 成功するとそのままログイン状態になり（セッションの Cookie が保存される）、トップに戻る。
 */
export default function Page() {
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    // ブラウザ標準の送信（ページ遷移）を止めて、authClient で送る
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name"));
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    });
    // 暫定実装なので、エラーは画面に出さずコンソールに出すだけにしている
    if (error) {
      console.error(error);
      return;
    }
    router.push("/");
  }
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm onSubmit={onSubmit} />
      </div>
    </div>
  );
}
