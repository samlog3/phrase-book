// サーバー専用。`NEXT_PUBLIC_` の付かない環境変数はブラウザでは読めないため、Client Component から import するとビルドで落とす
import "server-only";
import { requireEnv } from "./env";

/**
 * web のサーバーから api を呼ぶときの URL。`api-client.ts` で使う。
 * ブラウザ用の `NEXT_PUBLIC_API_URL` と分けているのは、Docker ではコンテナの中の `localhost` が自分自身を指すため。
 * ローカルでは `http://localhost:8787`、Docker Compose では `http://api:8787` になる。
 */
export const serverApiUrl = requireEnv("API_URL", process.env.API_URL);
