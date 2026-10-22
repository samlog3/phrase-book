const FALLBACK = "/";

// ブラウザは URL 解釈時にタブ・改行などの制御文字を取り除く。
// "/\t/evil.com" が "//evil.com" として解釈されるのを防ぐため、制御文字を含む値は弾く。
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
export const AFTER_LOGIN_PATH = "/phrases";

/**
 * ログイン・サインアップ後の遷移先 (searchParams の値) を、サイト内の相対パスに限定して返す。
 * 安全でない値・配列・未指定はすべて fallback にフォールバックする (オープンリダイレクト対策)。
 * fallback には呼び出し側で決めた固定値だけを渡すこと
 */
export function getSafeRedirect(
  value: string | string[] | undefined,
  fallback: string = FALLBACK,
): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/")) return fallback;
  // "//evil.com" はプロトコル相対 URL、"/\evil.com" はブラウザが "//" と解釈する
  if (value[1] === "/" || value[1] === "\\") return fallback;
  if (CONTROL_CHARS.test(value)) return fallback;
  return value;
}
