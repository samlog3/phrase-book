"use client";

import Link from "next/link";
import {
  startTransition,
  useActionState,
  type ComponentProps,
  type FormEvent,
} from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { PhraseDetail } from "@/lib/api-types";
import {
  initialPhraseFormState,
  parsePhraseForm,
  type PhraseFieldErrors,
  type PhraseFormState,
} from "@/lib/schemas/phrase";

type PhraseFormProps = {
  /** 送信先の Server Action（作成なら createPhrase、編集なら updatePhrase.bind(null, id)） */
  action: (
    prevState: PhraseFormState,
    formData: FormData,
  ) => Promise<PhraseFormState>;
  /** 編集のときの今の値。作成のときは渡さず、空のフォームにする */
  defaultValues?: Pick<
    PhraseDetail,
    | "phrase"
    | "meaning"
    | "example"
    | "context"
    | "note"
    | "source"
    | "sourceUrl"
    | "isPublic"
  >;
  submitLabel: string;
  pendingLabel: string;
  /** キャンセルで戻る先 */
  cancelHref: string;
};

/**
 * 作成（/phrases/new）と編集（/phrases/[id]/edit）で使うフォーム。
 * - 送る前にブラウザで parsePhraseForm を通し、誤りがあれば Server Action を呼ばずにその場で表示する
 * - Server Action が返した PhraseFormState（api の 400 や想定外の失敗）も同じ state に入るので、表示は 1 か所で済む
 * - <form action> に渡さず onSubmit から呼ぶ。<form action> だと送ったあとに React がフォームを
 *   初期値に戻すので、エラーのときに入力した内容が消えてしまうため
 * - ブラウザ標準の検証は noValidate で止め、エラーは aria-invalid と aria-describedby で入力欄に結びつける
 */
export function PhraseForm({
  action,
  defaultValues,
  submitLabel,
  pendingLabel,
  cancelHref,
}: PhraseFormProps) {
  const [state, formAction, pending] = useActionState(
    async (prevState: PhraseFormState, formData: FormData) => {
      const result = parsePhraseForm(formData);
      if (!result.success) {
        return { status: "invalid", fieldErrors: result.fieldErrors } as const;
      }
      return action(prevState, formData);
    },
    initialPhraseFormState,
  );
  const fieldErrors = state.status === "invalid" ? state.fieldErrors : {};

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    // useActionState の formAction は、<form action> の外から呼ぶときは transition の中で呼ぶ
    startTransition(() => formAction(formData));
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            {state.status === "error" && (
              <FieldError>{state.message}</FieldError>
            )}
            <TextField
              name="phrase"
              label="フレーズ"
              required
              maxLength={100}
              defaultValue={defaultValues?.phrase}
              errors={fieldErrors.phrase}
              placeholder="break the ice"
            />
            <TextField
              name="meaning"
              label="意味"
              required
              maxLength={200}
              defaultValue={defaultValues?.meaning}
              errors={fieldErrors.meaning}
              placeholder="場の緊張をほぐす"
            />
            <TextField
              name="example"
              label="例文"
              multiline
              maxLength={200}
              defaultValue={defaultValues?.example}
              errors={fieldErrors.example}
            />
            <TextField
              name="context"
              label="使う場面"
              multiline
              maxLength={500}
              defaultValue={defaultValues?.context}
              errors={fieldErrors.context}
            />
            <TextField
              name="note"
              label="メモ"
              description="自分だけが見られます。公開しても表示されません"
              multiline
              maxLength={800}
              defaultValue={defaultValues?.note}
              errors={fieldErrors.note}
            />
            <TextField
              name="source"
              label="出典"
              maxLength={100}
              defaultValue={defaultValues?.source}
              errors={fieldErrors.source}
              placeholder="Friends S1E3"
            />
            <TextField
              name="sourceUrl"
              label="出典の URL"
              type="url"
              maxLength={2048}
              defaultValue={defaultValues?.sourceUrl}
              errors={fieldErrors.sourceUrl}
              placeholder="https://example.com"
            />
            <Field orientation="horizontal">
              {/* オンのときだけ "true" が送られる（オフでは何も送られない） */}
              <Switch
                id="isPublic"
                name="isPublic"
                value="true"
                defaultChecked={defaultValues?.isPublic ?? false}
              />
              <FieldContent>
                <FieldLabel htmlFor="isPublic">公開する</FieldLabel>
                <FieldDescription>
                  公開すると、ログインしていない人も見られます
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field orientation="horizontal" className="justify-end">
              <Link
                href={cancelHref}
                className={buttonVariants({ variant: "outline" })}
              >
                キャンセル
              </Link>
              <Button type="submit" disabled={pending}>
                {pending ? pendingLabel : submitLabel}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

type TextFieldProps = {
  name: keyof PhraseFieldErrors;
  label: string;
  description?: string;
  required?: boolean;
  /** 複数行で入力する項目は Textarea にする */
  multiline?: boolean;
  /** 説明に出す文字数の上限。shared のスキーマと同じ値にする */
  maxLength: number;
  defaultValue?: string | null;
  errors?: string[];
  type?: ComponentProps<"input">["type"];
  placeholder?: string;
};

/**
 * ラベル・入力欄・説明・エラーの 1 組。
 * maxLength は入力欄の属性には付けない。付けると上限で入力が止まり、超えたときのエラーを確かめられないため。
 */
function TextField({
  name,
  label,
  description,
  required,
  multiline,
  maxLength,
  defaultValue,
  errors,
  type = "text",
  placeholder,
}: TextFieldProps) {
  const errorId = `${name}-error`;
  const descriptionId = `${name}-description`;
  const inputProps = {
    id: name,
    name,
    // null（未入力の任意項目）は空欄として表示する
    defaultValue: defaultValue ?? "",
    "aria-invalid": !!errors,
    "aria-describedby": errors ? `${descriptionId} ${errorId}` : descriptionId,
    required,
    placeholder,
  };

  return (
    <Field data-invalid={!!errors}>
      <FieldLabel htmlFor={name}>
        {label}
        {required ? (
          // 必須であることは required 属性でスクリーンリーダーに伝わるので、記号は読ませない
          <span aria-hidden className="text-destructive">
            *
          </span>
        ) : (
          <span className="text-xs font-normal text-muted-foreground">
            任意
          </span>
        )}
      </FieldLabel>
      {multiline ? (
        <Textarea {...inputProps} />
      ) : (
        <Input {...inputProps} type={type} />
      )}
      <FieldDescription id={descriptionId}>
        {description && `${description}。`}
        {maxLength}文字まで
      </FieldDescription>
      {errors && <FieldError id={errorId}>{errors[0]}</FieldError>}
    </Field>
  );
}
