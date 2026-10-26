import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@phrase-book/shared";
import * as z from "zod";
import type { FieldErrorsOf } from "./field-errors";

export const signupSchema = z.object({
  name: z.string().trim().min(1, { error: "名前を入力してください" }),
  email: z
    .string()
    .trim()
    .min(1, { error: "メールアドレスを入力してください" })
    .pipe(z.email({ error: "メールアドレスの形式が正しくありません" })),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, {
      error: `パスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください`,
    })
    .max(PASSWORD_MAX_LENGTH, {
      error: `パスワードは${PASSWORD_MAX_LENGTH}文字以内で入力してください`,
    }),
});

export const loginSchema = z.object({
  email: signupSchema.shape.email,
  password: z.string().min(1, { error: "パスワードを入力してください" }),
});

export type SignupFieldErrors = FieldErrorsOf<typeof signupSchema>;
export type LoginFieldErrors = FieldErrorsOf<typeof loginSchema>;
