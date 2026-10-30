/**
 * 環境変数の値を確かめて返す。未設定なら投げて、設定漏れにすぐ気づけるようにする。
 * 戻り値を `string` にすることで、import した側でも `undefined` を考えずに使える。
 *
 * api の `requireEnv` と違って、名前ではなく値を受け取る。
 * `NEXT_PUBLIC_` の環境変数は、ビルド時に `process.env.NEXT_PUBLIC_XXX` と書かれた箇所だけが値に置き換わるため、
 * `process.env[name]` のように動的に読むとブラウザでは常に `undefined` になる。
 */
export function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} が設定されていません`);
  }
  return value;
}

/** API サーバーの URL。Better Auth のクライアントの `baseURL` で使う */
export const apiUrl = requireEnv(
  "NEXT_PUBLIC_API_URL",
  process.env.NEXT_PUBLIC_API_URL,
);
