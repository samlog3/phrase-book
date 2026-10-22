"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import * as z from "zod";
import { LoginForm } from "@/components/login-form";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage, NETWORK_ERROR_MESSAGE } from "@/lib/auth-errors";
import { loginSchema, type LoginFieldErrors } from "@/lib/schemas/auth";

/**
 * ログイン画面の振る舞い。入力の検証、送信、エラー表示の状態を持つ。
 * 見た目は `LoginForm` に任せる。成功すると `redirectTo` に移動する。
 */
export function LoginView({
  redirectTo,
  signupHref,
}: {
  redirectTo: string;
  signupHref: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [serverError, setServerError] = useState<string>();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    // ブラウザ標準の送信（ページ遷移）を止めて、authClient で送る
    event.preventDefault();
    setFieldErrors({});
    setServerError(undefined);

    const formData = new FormData(event.currentTarget);
    const result = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!result.success) {
      setFieldErrors(z.flattenError(result.error).fieldErrors);
      return;
    }

    setPending(true);
    try {
      const { error } = await authClient.signIn.email(result.data);
      if (error) {
        setServerError(getAuthErrorMessage(error.code));
        setPending(false);
        return;
      }
      // 成功時は pending を戻さない。遷移が終わるまでボタンを押せないままにして二重送信を防ぐ
      router.push(redirectTo);
      // ログインで Cookie が変わったので、Server Component を描画し直してログイン状態を反映する
      router.refresh();
    } catch {
      setServerError(NETWORK_ERROR_MESSAGE);
      setPending(false);
    }
  }

  return (
    <LoginForm
      onSubmit={onSubmit}
      pending={pending}
      fieldErrors={fieldErrors}
      serverError={serverError}
      signupHref={signupHref}
    />
  );
}
