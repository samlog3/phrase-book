"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import * as z from "zod";
import { SignupForm } from "@/components/signup-form";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage, NETWORK_ERROR_MESSAGE } from "@/lib/auth-errors";
import { signupSchema, type SignupFieldErrors } from "@/lib/schemas/auth";

/**
 * サインアップ画面の振る舞い。入力の検証、送信、エラー表示の状態を持つ。
 * 見た目は `SignupForm` に任せる。成功すると `redirectTo` に移動する。
 */
export function SignupView({
  redirectTo,
  loginHref,
}: {
  redirectTo: string;
  loginHref: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const [serverError, setServerError] = useState<string>();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    // ブラウザ標準の送信（ページ遷移）を止めて、authClient で送る
    event.preventDefault();
    setFieldErrors({});
    setServerError(undefined);

    const formData = new FormData(event.currentTarget);
    const result = signupSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!result.success) {
      setFieldErrors(z.flattenError(result.error).fieldErrors);
      return;
    }

    setPending(true);
    try {
      const { error } = await authClient.signUp.email(result.data);
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
    <SignupForm
      onSubmit={onSubmit}
      pending={pending}
      fieldErrors={fieldErrors}
      serverError={serverError}
      loginHref={loginHref}
    />
  );
}
