// import の順番によらず .env を読めるように、ここでも読み込む（何度呼んでも問題ない）
import "dotenv/config";

/**
 * 環境変数を取り出す。未設定なら起動時に投げて、設定漏れにすぐ気づけるようにする。
 * 戻り値を `string` にすることで、import した側でも `undefined` を考えずに使える。
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} が設定されていません`);
  }
  return value;
}

/** フロントエンドのオリジン。CORS の `origin` と Better Auth の `trustedOrigins` で使う */
export const webOrigin = requireEnv("WEB_ORIGIN");
