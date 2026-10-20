import { describe, expect, it } from "vitest";
import {
  createPhraseSchema,
  phraseIdParamSchema,
  updatePhraseSchema,
} from "./phrase.js";

describe("createPhraseSchema", () => {
  it("前後の空白を除き、任意項目の空文字・空白だけ・null は null にする", () => {
    const result = createPhraseSchema.parse({
      phrase: "  hello  ",
      meaning: "こんにちは",
      example: "",
      context: "   ",
      note: null,
      source: " book ",
      sourceUrl: "",
    });

    expect(result).toEqual({
      phrase: "hello",
      meaning: "こんにちは",
      example: null,
      context: null,
      note: null,
      source: "book",
      sourceUrl: null,
    });
  });

  it("任意項目を送らなければ、キーごとない", () => {
    const result = createPhraseSchema.parse({ phrase: "p", meaning: "m" });

    expect(result).toEqual({ phrase: "p", meaning: "m" });
  });

  it.each([
    ["phrase がない", { meaning: "m" }],
    ["meaning がない", { phrase: "p" }],
    ["phrase が空白だけ", { phrase: "   ", meaning: "m" }],
    ["phrase が101文字", { phrase: "a".repeat(101), meaning: "m" }],
    ["meaning が201文字", { phrase: "p", meaning: "a".repeat(201) }],
    ["sourceUrl が ftp", { phrase: "p", meaning: "m", sourceUrl: "ftp://a.com" }],
    [
      "sourceUrl が javascript",
      { phrase: "p", meaning: "m", sourceUrl: "javascript:alert(1)" },
    ],
  ])("%s → 失敗", (_name, input) => {
    expect(createPhraseSchema.safeParse(input).success).toBe(false);
  });

  it("上限ちょうど（phrase 100文字、meaning 200文字）は通る", () => {
    const input = { phrase: "a".repeat(100), meaning: "a".repeat(200) };

    expect(createPhraseSchema.safeParse(input).success).toBe(true);
  });

  it.each([true, false])("isPublic: %s はそのまま通る", (isPublic) => {
    const result = createPhraseSchema.parse({
      phrase: "p",
      meaning: "m",
      isPublic,
    });

    expect(result).toEqual({ phrase: "p", meaning: "m", isPublic });
  });

  it.each([
    ["null", null],
    ["文字列の true", "true"],
    ["数値の 1", 1],
  ])("isPublic が %s → 失敗", (_name, isPublic) => {
    const input = { phrase: "p", meaning: "m", isPublic };

    expect(createPhraseSchema.safeParse(input).success).toBe(false);
  });
});

describe("updatePhraseSchema", () => {
  it("{} は通る（何も変更しない）", () => {
    expect(updatePhraseSchema.parse({})).toEqual({});
  });

  it("phrase: null → 失敗（必須項目は空にできない）", () => {
    expect(updatePhraseSchema.safeParse({ phrase: null }).success).toBe(false);
  });

  it("任意項目の null は null のまま通る（空にする）", () => {
    expect(updatePhraseSchema.parse({ note: null })).toEqual({ note: null });
  });

  it("isPublic だけでも通る", () => {
    expect(updatePhraseSchema.parse({ isPublic: true })).toEqual({
      isPublic: true,
    });
  });

  it("isPublic: null → 失敗（空にする意味がない）", () => {
    expect(updatePhraseSchema.safeParse({ isPublic: null }).success).toBe(
      false,
    );
  });
});

describe("phraseIdParamSchema", () => {
  it.each(["01", "0", "abc", "-1", "1.5", "2147483648"])("%s → 失敗", (id) => {
    expect(phraseIdParamSchema.safeParse({ id }).success).toBe(false);
  });

  it.each([
    ["1", 1],
    ["2147483647", 2147483647],
  ])("%s → 数値の %d になる", (id, expected) => {
    expect(phraseIdParamSchema.parse({ id })).toEqual({ id: expected });
  });
});
