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
        <CardTitle>アカウントを作成</CardTitle>
        <CardDescription>
          名前・メールアドレス・パスワードを入力してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form {...props} noValidate>
          <FieldGroup>
            {serverError && <FieldError>{serverError}</FieldError>}
            <Field>
              <FieldLabel htmlFor="name">名前</FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                aria-invalid={!!fieldErrors?.name}
                aria-describedby={fieldErrors?.name ? "name-error" : undefined}
                placeholder="山田 太郎"
                required
              />
              {fieldErrors?.name && (
                <FieldError id="name-error">{fieldErrors.name[0]}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="email">メールアドレス</FieldLabel>
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
                ログインに使います。他のユーザーには公開されません。
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">パスワード</FieldLabel>
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
                {PASSWORD_MIN_LENGTH}文字以上で入力してください。
              </FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={pending}>
                  {pending ? "作成中..." : "アカウントを作成"}
                </Button>
                <FieldDescription className="px-6 text-center">
                  アカウントをお持ちの方は <Link href={loginHref}>ログイン</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
