# phrase-book

英語フレーズ帳アプリ。詳細は [docs/overview.md](docs/overview.md)。

## 必要なもの

- Node.js 24（`nvm use`）
- pnpm
- Docker（MySQL を Docker Compose で動かす）

## 初回セットアップ

```bash
pnpm install

# 1. 環境変数（2か所）
cp .env.example .env    # Docker Compose 用：MYSQL_ROOT_PASSWORD・MYSQL_DATABASE を設定
# apps/api/.env を作り、DATABASE_URL を書く（下記参照）

# 2. MySQL を起動（docker compose ps で (healthy) になるまで待つ）
pnpm db:up

# 3. マイグレーションを適用し、Prisma Client を生成
pnpm --filter @phrase-book/api db:migrate
pnpm --filter @phrase-book/api db:generate
```

`apps/api/.env` の内容：

```
DATABASE_URL="mysql://root:<MYSQL_ROOT_PASSWORD>@localhost:3307/<MYSQL_DATABASE>"
```

- 値はルートの `.env` と同じものを**直接**書く（`${MYSQL_ROOT_PASSWORD}` のような変数参照は展開されない）
- ポートは **3307**（Mac 側から接続するときの番号。compose.yaml で `3307:3306` にしている）
- パスワードは英数字のみにする（`%` などの記号が入ると `URI malformed` になる）
- Prisma Client（`apps/api/src/generated/prisma`）は git の管理外なので、clone 後は `db:generate` が必要

## 起動

```bash
pnpm db:up      # MySQL を起動
pnpm dev        # web: http://localhost:3000 / api: http://localhost:8787
pnpm db:down    # MySQL を停止（データは残る）
```

## 開発用コマンド

```bash
pnpm lint
pnpm typecheck
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
