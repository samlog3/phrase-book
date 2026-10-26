import type * as z from "zod";

// z.flattenError(...).fieldErrors の型。スキーマに項目を足すとフォームの型も追従する
export type FieldErrorsOf<S extends z.ZodType> = z.core.$ZodFlattenedError<
  z.infer<S>
>["fieldErrors"];
