import { describe, expect, it } from "vitest";
import { isPublicPath } from "./public-paths";

describe("isPublicPath", () => {
  it.each(["/", "/login", "/signup", "/public", "/public/1", "/public/abc"])(
    "公開する: %s",
    (path) => {
      expect(isPublicPath(path)).toBe(true);
    },
  );

  it.each([
    ["保護された画面", "/phrases"],
    ["保護された画面の下", "/phrases/1"],
    ["/public で始まる別のパス", "/publicxxx"],
    ["/public で始まる別のパスの下", "/public-phrases/1"],
    ["完全一致のパスの下", "/login/xxx"],
    ["大文字", "/Public"],
    ["途中に /public", "/phrases/public"],
  ])("保護する: %s (%s)", (_label, path) => {
    expect(isPublicPath(path)).toBe(false);
  });
});
