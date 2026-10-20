import { describe, expect, it } from "vitest";
import { getSafeRedirect } from "./redirect";

describe("getSafeRedirect", () => {
  it.each(["/", "/phrases", "/phrases/abc?x=1"])("許可する: %s", (path) => {
    expect(getSafeRedirect(path)).toBe(path);
  });

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
  ])("拒否して / を返す: %s", (_label, input) => {
    expect(getSafeRedirect(input)).toBe("/");
  });

  it("undefined は / を返す", () => {
    expect(getSafeRedirect(undefined)).toBe("/");
  });

  it("配列は先頭が安全でも / を返す", () => {
    expect(getSafeRedirect(["/phrases"])).toBe("/");
    expect(getSafeRedirect(["/phrases", "//evil.com"])).toBe("/");
    expect(getSafeRedirect([])).toBe("/");
  });
});
