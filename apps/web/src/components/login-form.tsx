import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { LoginFieldErrors } from "@/lib/schemas/auth";

type LoginFormProps = React.ComponentProps<"form"> & {
  pending: boolean;
  fieldErrors?: LoginFieldErrors;
  serverError?: string;
  signupHref: string;
};

/**
 * ログインフォームの見た目。検証や送信の処理は持たず、呼び出し側（`LoginView`）が
 * `onSubmit` と、`pending` / `fieldErrors` / `serverError` の状態を渡す。
 * ブラウザ標準の検証は `noValidate` で止めているため、エラーは `aria-invalid` と
 * `aria-describedby` で入力欄に結びつけ、スクリーンリーダーにも伝わるようにしている。
 * 入力値は `FormData` で取り出せるよう、各 input に `name` を付けている。
 */
export function LoginForm({
  pending,
  fieldErrors,
  serverError,
  signupHref,
  ...props
}: LoginFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form {...props} noValidate>
          <FieldGroup>
            {serverError && <FieldError>{serverError}</FieldError>}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                aria-invalid={!!fieldErrors?.email}
                aria-describedby={
                  fieldErrors?.email ? "email-error" : undefined
                }
                placeholder="m@example.com"
                required
              />
              {fieldErrors?.email && (
                <FieldError id="email-error">{fieldErrors.email[0]}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                aria-invalid={!!fieldErrors?.password}
                aria-describedby={
                  fieldErrors?.password ? "password-error" : undefined
                }
                required
              />
              {fieldErrors?.password && (
                <FieldError id="password-error">
                  {fieldErrors.password[0]}
                </FieldError>
              )}
            </Field>
            <Field>
              <Button type="submit" disabled={pending}>
                {pending ? "ログイン中..." : "Login"}
              </Button>
              <FieldDescription className="text-center">
                Don&apos;t have an account?{" "}
                <Link href={signupHref}>Sign up</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
