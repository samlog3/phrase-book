"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoginForm } from "@/components/login-form";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { loginSchema } from "@/lib/schemas/auth";
import * as z from "zod";

type FieldErrors = { email?: string[]; password?: string[] };

const NETWORK_ERROR_MESSAGE =
  "通信に失敗しました。ネットワークを確認してもう一度お試しください";

/**
 * ログイン画面の振る舞い。入力の検証、送信、エラー表示の状態を持つ。
 * 見た目は `LoginForm` に任せる。
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
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
