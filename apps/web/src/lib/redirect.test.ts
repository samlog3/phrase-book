import { describe, expect, it } from "vitest";
import { AFTER_LOGIN_PATH, getSafeRedirect } from "./redirect";

describe("getSafeRedirect", () => {
  it.each(["/", "/phrases", "/phrases/abc?x=1"])("許可する: %s", (path) => {
    expect(getSafeRedirect(path)).toBe(path);
  });

  it("fallback より入力の値を優先する", () => {
    expect(getSafeRedirect("/phrases/abc", "/other")).toBe("/phrases/abc");
    expect(getSafeRedirect("/", AFTER_LOGIN_PATH)).toBe("/");
  });

  describe.each([
    ["fallback 省略時は /", undefined, "/"],
    ["fallback を渡すとそれ", AFTER_LOGIN_PATH, AFTER_LOGIN_PATH],
  ])("使えない値のとき (%s)", (_label, fallback, expected) => {
    it.each([
      ["絶対 URL", "https://evil.com"],
      ["プロトコル相対 URL", "//evil.com"],
      ["バックスラッシュ", "/\\evil.com"],
      ["スキームなしホスト", "evil.com"],
      ["javascript スキーム", "javascript:alert(1)"],
      ["空文字", ""],
      ["先頭に空白", " //evil.com"],
      ["先頭に空白 (通常パス)", " /phrases"],
      ["先頭に改行", "\n//evil.com"],
      ["/ の直後にタブ", "/\t/evil.com"],
      ["/ の直後に改行", "/\n/evil.com"],
      ["/ の直後に CR", "/\r/evil.com"],
      ["パス途中に制御文字", "/phrases\t/abc"],
    ])("拒否して fallback を返す: %s", (_label, input) => {
      expect(getSafeRedirect(input, fallback)).toBe(expected);
    });

    it("undefined は fallback を返す", () => {
      expect(getSafeRedirect(undefined, fallback)).toBe(expected);
    });

    it("配列は先頭が安全でも fallback を返す", () => {
      expect(getSafeRedirect(["/phrases"], fallback)).toBe(expected);
      expect(getSafeRedirect(["/phrases", "//evil.com"], fallback)).toBe(
        expected,
      );
      expect(getSafeRedirect([], fallback)).toBe(expected);
    });
  });
});
