# 認証と画面保護

## 前提

- セッションは Better Auth が api（`localhost:8787`）で発行する Cookie（`better-auth.session_token`）で管理する
- Cookie には `Domain` を付けていない。Cookie はポートを区別しないため、ブラウザは web（`localhost:3000`）へのリクエストにも同じ Cookie を付ける。そのため、web のサーバー側（Proxy、Server Component）でも Cookie を読める
- Cookie の値は署名付きのトークンで、web 側だけでは有効かどうか判断できない。有効かどうかは、Cookie を付けて api の `GET /api/auth/get-session` を呼んで確かめる
- 本番で web と api のドメインが分かれると、この前提は成り立たない。サブドメインにそろえて Cookie を共有する（Better Auth の `crossSubDomainCookies`）などの対応が必要になる（今回は対象外）

## 画面保護の方式

3 段でチェックする。データを守っているのは Hono で、web 側の 2 段は「データに触らせない」とは別に「保護された画面に入らせない」ためのもの。

| 段               | 確かめること                              | 未ログインのとき                     |
| ---------------- | ----------------------------------------- | ------------------------------------ |
| Proxy            | Cookie があるか（中身は確かめない）       | `/login?redirect=<元のパス>` へ 307  |
| Server Component | セッションが有効か（`requireSession` が api の get-session を呼ぶ） | `/login` へ移動する（`returnTo` を渡すと `?redirect=` 付き） |
| Hono             | セッションと、本人のデータか              | 401 / 404                            |

- 実装の場所
  - Proxy：`apps/web/src/proxy.ts`
  - Server Component 用の関数：`apps/web/src/lib/session.ts`
    - `getSession`：api に問い合わせて、有効なら `{ userId, email }`、なければ `null` を返す。移動はしない。`cache()` で包んであり、同じ描画中は api への問い合わせが 1 回で済む
    - `requireSession(returnTo?)`：`getSession` を呼び、未ログインなら `/login` へ移動する。`returnTo` を渡すと `?redirect=` に入る。保護された画面ではこちらを使う
- Proxy は Cookie があるかしか見ない。期限切れや偽の Cookie でも通るため、Server Component でも確かめる
- Proxy では api に問い合わせない。Proxy はプリフェッチを含むすべてのリクエストで動くため
- Proxy を置くのは、元のパスを `?redirect=` に入れて、描画の前に 307 で移動するため。Server Component からは今のパスを取れない
- Server Action の POST（`next-action` ヘッダー付き）は Proxy で移さずに通す
  - 移すと、クライアントは Server Action の応答（RSC）ではなく `/login` の HTML を受け取り、「An unexpected response was received from the server.」になる
  - 代わりに、Server Action が呼んだ api が 401 を返し、Server Action が `redirect` で `/login?redirect=<フォームのパス>` へ移す（[web.md](web.md) の「api のエラーの扱い」）
  - ヘッダーを付ければ普通の画面の GET も Proxy を通り抜けられるが、Server Component の `requireSession` と api で確かめるので、データは守られる
- layout だけではチェックしない。layout はページを移動しても再描画されず、layout が隠してもその下のページは描画されてしまうため
- `cacheComponents` が有効なので、`cookies()` を読む処理は `<Suspense>` の内側に置く（外で読むとビルドエラーになる）

### Proxy は公開する画面だけを列挙する

公開してよい画面（`/`、`/login`、`/signup`、`/public`、`/public/*`）だけを列挙し、それ以外はすべて保護する。画面を追加したときに列挙を忘れても、保護される側に倒れるようにするため。

- 現在の実装（`proxy.ts` の `publicRoutes`）は `/`、`/login`、`/signup` の完全一致だけ。`[id]` の部分は完全一致では通らないため、前方一致で判定する形に直す必要がある
- 静的ファイル（`_next/static`、画像など）は `matcher` で Proxy の対象から外す
- 存在しないパスを未ログインで開くと、404 ではなくログイン画面に移動する

## 移動のルール

| 場面                                         | 移動先                                                     |
| -------------------------------------------- | ---------------------------------------------------------- |
| 未ログインで保護された画面を開いた           | `/login?redirect=<元のパス>`                               |
| ログイン・サインアップに成功した             | `?redirect=` があればそこ、なければ `/phrases`             |
| ログイン済みで `/login`・`/signup` を開いた  | 同上                                                       |
| ログアウトした                               | `/`（ページごと再読み込みする）                            |

- ログイン済みの人の既定の移動先を `/phrases` にするのは、`/` が紹介ページで、ログインした人がそこでやることがないため
- ログイン済みの人を `/login` から移す判定は、Proxy ではなくページの Server Component（`getSession`）で行う。未ログインの人には画面を出したいので、`requireSession` ではなく `getSession` を使う。Proxy の Cookie チェックで移すと、期限切れの Cookie が残っているときに「Proxy が `/phrases` へ移す → Server Component が `/login` へ戻す」を繰り返してしまうため
- ログアウト後にページごと再読み込みするのは、Next の Client Cache を消すため。`router.push` で移動するだけだと、ブラウザの戻るボタンでキャッシュから保護された画面が表示されうる（戻る・進むの移動では、サーバーにリクエストせずキャッシュを使うため、Proxy も通らない）

### オープンリダイレクト対策

`?redirect=` の値は `getSafeRedirect`（`apps/web/src/lib/redirect.ts`）で検証し、サイト内の相対パスだけを許可する。

- `/` で始まらない値、`//evil.com`（プロトコル相対 URL）、`/\evil.com`（ブラウザが `//` と解釈する）、制御文字を含む値、配列は使わない
- 使えない値のときは、呼び出す側が決めた既定の移動先にする
