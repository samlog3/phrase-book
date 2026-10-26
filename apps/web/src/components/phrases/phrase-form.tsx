"use client";

import Link from "next/link";
import {
  startTransition,
  useActionState,
  useLayoutEffect,
  useRef,
  useState,
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
 * 保存できたら、次に開いたときに初期値から始まるようフォームを作り直す。
 * - cacheComponents が有効だと、移動した後も前の画面は消えずに Activity で隠れて残る。
 *   そのままだと、作成した後にもう一度開いたときに前の入力やエラーが残っている
 * - 保存できると Server Action は redirect し、呼んだ側には値が返らない（redirect のエラーで reject される）。
 *   値が返らないまま画面が隠れたら保存できたとみなし、key を変えて PhraseFormBody を作り直す
 * - 保存できなかったときは値（PhraseFormState）が返るので作り直さず、入力を残す
 */
export function PhraseForm({ action, ...props }: PhraseFormProps) {
  const [formKey, setFormKey] = useState(0);
  // 送ってから値が返るまでの間だけ true（保存できたときは redirect するので true のまま残る）
  const awaitingResultRef = useRef(false);

  // Activity で隠れるときに cleanup が呼ばれる
  useLayoutEffect(() => {
    const awaitingResult = awaitingResultRef;
    return () => {
      if (awaitingResult.current) {
        awaitingResult.current = false;
        setFormKey((key) => key + 1);
      }
    };
  }, []);

  async function trackedAction(prevState: PhraseFormState, formData: FormData) {
    awaitingResultRef.current = true;
    const state = await action(prevState, formData);
    awaitingResultRef.current = false;
    return state;
  }

  return <PhraseFormBody key={formKey} action={trackedAction} {...props} />;
}

/**
 * フォームの中身。PhraseForm が key を変えると作り直され、入力と state が初期値に戻る。
 * - 送る前にブラウザで parsePhraseForm を通し、誤りがあれば Server Action を呼ばずにその場で表示する
 * - Server Action が返した PhraseFormState（api の 400 や想定外の失敗）も同じ state に入るので、表示は 1 か所で済む
 * - <form action> に渡さず onSubmit から呼ぶ。<form action> だと送ったあとに React がフォームを
 *   初期値に戻すので、エラーのときに入力した内容が消えてしまうため
 * - ブラウザ標準の検証は noValidate で止め、エラーは aria-invalid と aria-describedby で入力欄に結びつける
 */
function PhraseFormBody({
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
