import { PASSWORD_MIN_LENGTH } from "@phrase-book/shared";
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
import type { SignupFieldErrors } from "@/lib/schemas/auth";

type SignupFormProps = React.ComponentProps<"form"> & {
  pending: boolean;
  fieldErrors?: SignupFieldErrors;
  serverError?: string;
  loginHref: string;
};

/**
 * サインアップフォームの見た目。検証や送信の処理は持たず、呼び出し側（`SignupView`）が
 * `onSubmit` と、`pending` / `fieldErrors` / `serverError` の状態を渡す。
 * ブラウザ標準の検証は `noValidate` で止めているため、エラーは `aria-invalid` と
 * `aria-describedby` で入力欄に結びつけ、スクリーンリーダーにも伝わるようにしている。
 * email と password は補足文もあるので、`aria-describedby` にエラー文と補足文の両方の id を並べる。
 * 入力値は `FormData` で取り出せるよう、各 input に `name` を付けている。
 */
export function SignupForm({
  pending,
  fieldErrors,
  serverError,
  loginHref,
  ...props
}: SignupFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form {...props} noValidate>
          <FieldGroup>
            {serverError && <FieldError>{serverError}</FieldError>}
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                aria-invalid={!!fieldErrors?.name}
                aria-describedby={fieldErrors?.name ? "name-error" : undefined}
                placeholder="John"
                required
              />
              {fieldErrors?.name && (
                <FieldError id="name-error">{fieldErrors.name[0]}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                aria-invalid={!!fieldErrors?.email}
                aria-describedby={
                  fieldErrors?.email ? "email-error email-hint" : "email-hint"
                }
                placeholder="m@example.com"
                required
              />
              {fieldErrors?.email && (
                <FieldError id="email-error">{fieldErrors.email[0]}</FieldError>
              )}
              <FieldDescription id="email-hint">
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                aria-invalid={!!fieldErrors?.password}
                aria-describedby={
                  fieldErrors?.password
                    ? "password-error password-hint"
                    : "password-hint"
                }
                required
              />
              {fieldErrors?.password && (
                <FieldError id="password-error">
                  {fieldErrors.password[0]}
                </FieldError>
              )}
              <FieldDescription id="password-hint">
                Must be at least {PASSWORD_MIN_LENGTH} characters long.
              </FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={pending}>
                  {pending ? "作成中..." : "Create Account"}
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <Link href={loginHref}>Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
