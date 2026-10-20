const FALLBACK = "/";

// ブラウザは URL 解釈時にタブ・改行などの制御文字を取り除く。
// "/\t/evil.com" が "//evil.com" として解釈されるのを防ぐため、制御文字を含む値は弾く。
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

/**
 * ログイン後の遷移先 (searchParams の値) を、サイト内の相対パスに限定して返す。
 * 安全でない値・配列・未指定はすべて "/" にフォールバックする (オープンリダイレクト対策)。
 */
export function getSafeRedirect(
  value: string | string[] | undefined,
): string {
  if (typeof value !== "string") return FALLBACK;
  if (!value.startsWith("/")) return FALLBACK;
  // "//evil.com" はプロトコル相対 URL、"/\evil.com" はブラウザが "//" と解釈する
  if (value[1] === "/" || value[1] === "\\") return FALLBACK;
  if (CONTROL_CHARS.test(value)) return FALLBACK;
  return value;
}
