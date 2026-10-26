import { describe, expect, it } from "vitest";
import { parsePhraseForm } from "./phrase";

/** フォームが送る形（全項目がそろっていて、未入力は ""）で FormData を作る */
function formDataOf(values: Record<string, string> = {}) {
  const formData = new FormData();
  const filled = {
    phrase: "break the ice",
    meaning: "場の緊張をほぐす",
    example: "",
    context: "",
    note: "",
    source: "",
    sourceUrl: "",
    ...values,
  };
  for (const [key, value] of Object.entries(filled)) {
    formData.set(key, value);
  }
  return formData;
}

describe("parsePhraseForm", () => {
  it("未入力の任意項目は null、スイッチがオフなら isPublic は false", () => {
    expect(parsePhraseForm(formDataOf())).toEqual({
      success: true,
      data: {
        phrase: "break the ice",
        meaning: "場の緊張をほぐす",
        example: null,
        context: null,
        note: null,
        source: null,
        sourceUrl: null,
        isPublic: false,
      },
    });
  });

  it("スイッチがオンなら isPublic は true", () => {
    const result = parsePhraseForm(formDataOf({ isPublic: "true" }));
    expect(result.success && result.data.isPublic).toBe(true);
  });

  it.each(["phrase", "meaning"])("必須項目 %s が空白だけならエラー", (name) => {
    expect(parsePhraseForm(formDataOf({ [name]: "   " }))).toEqual({
      success: false,
      fieldErrors: { [name]: ["入力してください"] },
    });
  });

  it("文字数の上限を超えたらエラー", () => {
    expect(parsePhraseForm(formDataOf({ phrase: "a".repeat(101) }))).toEqual({
      success: false,
      fieldErrors: { phrase: ["100文字以内で入力してください"] },
    });
  });

  it.each(["javascript:alert(1)", "ftp://example.com", "example.com"])(
    "http / https でない sourceUrl はエラー: %s",
    (sourceUrl) => {
      expect(parsePhraseForm(formDataOf({ sourceUrl }))).toEqual({
        success: false,
        fieldErrors: {
          sourceUrl: ["http:// か https:// で始まる URL を入力してください"],
        },
      });
    },
  );

  it("項目が送られてこなければエラー", () => {
    const formData = formDataOf();
    formData.delete("phrase");
    expect(parsePhraseForm(formData)).toEqual({
      success: false,
      fieldErrors: { phrase: ["入力内容が正しくありません"] },
    });
  });
});
