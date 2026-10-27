# phrase-book

出会った英語フレーズを保存するフレーズ帳アプリ。入社前課題として、TypeScript / Next.js / Hono / MySQL / Prisma の構成で、CRUD・認証・認可を一通り実装した。

- 意味・例文・使う場面・出典などをまとめて保存できる
- フレーズごとに公開・非公開を切り替えられる。公開フレーズはログインなしで誰でも見られる
- 自分のフレーズだけを編集・削除できる

## 技術スタック

| 領域           | 技術                                                      |
| -------------- | --------------------------------------------------------- |
| フロント       | Next.js（App Router）、React、shadcn/ui                   |
| API            | Hono（`@hono/node-server`）、Hono RPC                     |
| DB / ORM       | MySQL 8.4（Docker Compose）、Prisma                       |
| 認証           | Better Auth（メールアドレスとパスワード、Cookie セッション） |
| バリデーション | zod（web と api で共有）                                  |
| テスト         | Vitest（Hono の `app.request()` を使った API テスト）     |
| 構成管理       | pnpm workspaces（モノレポ）                               |

## 構成

```
apps/web/          Next.js（localhost:3000）。UI と、api を呼ぶ窓口だけを持つ
apps/api/          Hono + Prisma + Better Auth（localhost:8787）。DB と認証・認可を持つ
packages/shared/   web と api で共有する zod スキーマ・エラーコード・定数
docs/              設計のドキュメント
```

## 必要なもの

- Node.js 24（`nvm use`）
- pnpm
- Docker（MySQL を Docker Compose で動かす）

## 初回セットアップ

```bash
pnpm install

# 1. 環境変数（3か所。中身は下記）
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 2. MySQL を起動（docker compose ps で (healthy) になるまで待つ）
pnpm db:up

# 3. マイグレーションを適用し、Prisma Client を生成
pnpm --filter @phrase-book/api db:migrate
pnpm --filter @phrase-book/api db:generate
```

### 環境変数

| ファイル              | 変数                    | 内容                                                                  |
| --------------------- | ----------------------- | --------------------------------------------------------------------- |
| `.env`                | `MYSQL_ROOT_PASSWORD`   | MySQL の root のパスワード（Docker Compose が読む）                   |
|                       | `MYSQL_DATABASE`        | 作る DB の名前                                                        |
| `apps/api/.env`       | `DATABASE_URL`          | `mysql://root:<MYSQL_ROOT_PASSWORD>@localhost:3307/<MYSQL_DATABASE>`  |
|                       | `BETTER_AUTH_SECRET`    | セッションの署名に使う秘密の値。`openssl rand -base64 32` などで作る  |
|                       | `BETTER_AUTH_URL`       | api の URL（`http://localhost:8787`）                                 |
|                       | `WEB_ORIGIN`            | web のオリジン（`http://localhost:3000`）。CORS と CSRF 対策で使う    |
| `apps/web/.env.local` | `NEXT_PUBLIC_API_URL`   | api の URL（`http://localhost:8787`）                                 |

- `DATABASE_URL` には、ルートの `.env` と同じ値を**直接**書く（`${MYSQL_ROOT_PASSWORD}` のような変数参照は展開されない）
- ポートは **3307**（Mac 側から接続するときの番号。compose.yaml で `3307:3306` にしている）
- パスワードは英数字のみにする（`%` などの記号が入ると `URI malformed` になる）
- `BETTER_AUTH_URL` が api の URL と合っていないと、ログインなどが 403 `INVALID_ORIGIN` になる
- 環境変数が足りないと、api と web は起動時にエラーで止まる
- Prisma Client（`apps/api/src/generated/prisma`）は git の管理外なので、clone 後は `db:generate` が必要

## 起動

```bash
pnpm db:up      # MySQL を起動
pnpm dev        # web: http://localhost:3000 / api: http://localhost:8787
pnpm db:down    # MySQL を停止（データは残る）
```

http://localhost:3000 を開き、サインアップするとフレーズを登録できる。

## 開発用コマンド

```bash
pnpm lint
pnpm typecheck
pnpm test
```

### DB（Prisma）

```bash
pnpm --filter @phrase-book/api db:migrate --name <名前>  # schema.prisma の変更からマイグレーションを作成・適用
pnpm --filter @phrase-book/api db:generate               # Prisma Client を生成
pnpm --filter @phrase-book/api db:studio                 # Prisma Studio（ブラウザで DB を確認）
```

### DB を作り直す

データはすべて消える。`.env` の `MYSQL_ROOT_PASSWORD`・`MYSQL_DATABASE` を変えたときも、初回起動時にしか反映されないため作り直しが必要。

```bash
docker compose down -v                       # コンテナとボリュームを削除
pnpm db:up                                   # docker compose ps で (healthy) を待つ
pnpm --filter @phrase-book/api db:migrate    # 既存のマイグレーションを適用
pnpm --filter @phrase-book/api db:generate
```

## 設計の判断

詳しい理由はそれぞれのドキュメントにまとめている。

### フロントと API を分ける

- web（Next.js）は UI だけを持ち、DB には触らない。データの読み書きと、セッション・本人のデータかの確認は api（Hono）が行う
- web は api の `AppType` を型としてだけ import し、Hono RPC で呼ぶ。API の変更が web の型エラーとして見える
- zod スキーマは `packages/shared` に置き、api のバリデーションと web のフォームの検証で同じものを使う
- api の中は route → service → Prisma に分ける。認可（`userId` での絞り込み）は service に集める

→ [docs/overview.md](docs/overview.md)、[docs/api.md](docs/api.md)

### 権限がないときは 404 を返す

他人のフレーズや非公開のフレーズにアクセスしたときは、403 ではなく 404 を返す。403 だと「その ID のフレーズがある」ことが分かってしまうため。ログインが必要な API に未ログインでアクセスしたときだけ 401 を返す。

→ [docs/api.md](docs/api.md)

### 自分用と公開用でパスと実装を分ける

API は `/api/phrases`（ログイン必須）と `/api/public/phrases`（ログイン不要）、画面は `/phrases` と `/public` に分ける。自分用の関数に「公開なら見せる」分岐を足すと認可の条件が読みにくくなるため。公開用のレスポンスには `note`（自分用のメモ）と `userId` を含めない。

→ [docs/api.md](docs/api.md)

### 画面保護は 3 段で行う

| 段               | 確かめること                                         |
| ---------------- | ---------------------------------------------------- |
| Proxy            | Cookie があるか。なければ `/login?redirect=<元のパス>` へ移す |
| Server Component | api に問い合わせて、セッションが有効か               |
| Hono             | セッションと、本人のデータか（データを守る本体）     |

- Proxy は公開してよい画面だけを列挙し、それ以外はすべて保護する。画面を足したときに列挙を忘れても、保護される側に倒れるようにするため
- Proxy は Cookie の有無しか見ない（すべてのリクエストで動くので api に問い合わせない）ので、Server Component でも確かめる
- `?redirect=` はサイト内の相対パスだけを許可する（オープンリダイレクト対策）

→ [docs/auth.md](docs/auth.md)

### 別オリジンでの Cookie と CORS

- セッションは Better Auth が api で発行する Cookie で管理する。Cookie はポートを区別しないので、web のサーバーでも読める
- web のサーバーから api を呼ぶときは、Cookie が自動で付かないので `cookie` ヘッダーを手動で転送する
- ブラウザから api を直接呼ぶのは認証（サインアップ・ログイン・ログアウト）だけ。CORS は `origin` を明示し、`credentials: true` にする

→ [docs/web.md](docs/web.md)、[docs/auth.md](docs/auth.md)

### 読み込みは Server Component、書き込みは Server Action

画面は Server Component を基本にし、フォームと削除の確認だけを Client Component にする。書き込みは Server Action から api を呼ぶ。

→ [docs/web.md](docs/web.md)

### 中間テーブルは明示的に作る（今後の拡張）

タグとフレーズの多対多は、Prisma の暗黙の中間テーブルではなく、明示的なモデル（`PhraseTag`）で作る予定。中間テーブルにカラムを足せて、SQL との対応も見えるため。

→ [docs/overview.md](docs/overview.md)

## ドキュメント

| ファイル                               | 内容                                                       |
| -------------------------------------- | ---------------------------------------------------------- |
| [docs/overview.md](docs/overview.md)   | 目的、スコープ、データモデル、画面の一覧、進める順番       |
| [docs/api.md](docs/api.md)             | API の仕様、エラーの形、認可の実装方針                     |
| [docs/auth.md](docs/auth.md)           | 認証と画面保護の方式、移動のルール                         |
| [docs/web.md](docs/web.md)             | Server Component・Client Component・Server Action の使い分け |
