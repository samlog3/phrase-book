import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "./auth-errors";

const FALLBACK =
  "エラーが発生しました。しばらくしてからもう一度お試しください";

describe("getAuthErrorMessage", () => {
  it("INVALID_EMAIL_OR_PASSWORD", () => {
    expect(getAuthErrorMessage("INVALID_EMAIL_OR_PASSWORD")).toBe(
      "メールアドレスまたはパスワードが正しくありません",
    );
  });

  it.each(["USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", "USER_ALREADY_EXISTS"])(
    "既存ユーザー: %s",
    (code) => {
      expect(getAuthErrorMessage(code)).toBe(
        "このメールアドレスは既に登録されています",
      );
    },
  );

  it("未知のコードはフォールバック", () => {
    expect(getAuthErrorMessage("SOMETHING_UNKNOWN")).toBe(FALLBACK);
  });

  it("undefined はフォールバック", () => {
    expect(getAuthErrorMessage(undefined)).toBe(FALLBACK);
  });

  it.each(["constructor", "toString", "__proto__", "hasOwnProperty"])(
    "プロトタイプのプロパティ名 %s はフォールバック",
    (code) => {
      expect(getAuthErrorMessage(code)).toBe(FALLBACK);
    },
  );
});
