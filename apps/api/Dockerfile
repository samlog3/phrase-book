# pnpm 公式イメージを使う
FROM ghcr.io/pnpm/pnpm:12
# このイメージに Node 24 を入れる
RUN pnpm runtime set node 24 -g

# リポジトリのルートに相当する場所
WORKDIR /app

# リポジトリ全体をコピーする（不要なものは .dockerignore で除外済み）
COPY . .

# api と、api が依存するワークスペースのパッケージ（shared）の依存だけを、lockfile のとおりにインストールする
# web の依存（Next.js や React など）は api では使わないので入れない
RUN pnpm install --frozen-lockfile --filter "@phrase-book/api..."

# Prisma Client を生成する（生成コードは Git に入っていないため）
RUN pnpm --filter @phrase-book/api db:generate

# TypeScript を dist/ にビルドする
RUN pnpm --filter @phrase-book/api build

# API が使うポート（src/index.ts で 8787）
EXPOSE 8787

# exec 形式で起動する（start は apps/api の中で動くので、dist/index.js が見つかる）
CMD ["pnpm", "--filter", "@phrase-book/api", "start"]
