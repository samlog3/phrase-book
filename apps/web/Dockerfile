# ===== ビルド用のステージ =====
# pnpm 公式イメージを使う
FROM ghcr.io/pnpm/pnpm:12 AS build
# このイメージに Node 24 を入れる
RUN pnpm runtime set node 24 -g

# リポジトリのルートに相当する場所
WORKDIR /app

# リポジトリ全体をコピーする（不要なものは .dockerignore で除外済み）
COPY . .

# ワークスペース全体の依存を、lockfile のとおりにインストールする
# （web は devDependencies に api を持つので、--filter しても api・shared まで入り、ほぼ減らない）
RUN pnpm install --frozen-lockfile

# API 側の Prisma Client を生成する（web の型チェックで AppType の先の型が必要なため）
RUN pnpm --filter @phrase-book/api db:generate

# NEXT_PUBLIC_ の値はビルド時にコードへ埋め込まれるので、build より前に受け取る
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# web のサーバーから api を呼ぶ URL。next build がページを読み込むときにも必要なので、ビルド前に入れておく
# NEXT_PUBLIC_ と違ってコードに埋め込まれないので、起動時に compose の environment で渡した値のほうが使われる
ENV API_URL=http://api:8787

# Next.js をビルドする。next.config.ts の output: "standalone" により、
# 実行に必要なファイルだけが apps/web/.next/standalone に集まる
RUN pnpm --filter @phrase-book/web build

# ===== 実行用のステージ =====
# ビルド用のステージから、できあがったものだけを持ってくる。pnpm や devDependencies は入らない
FROM node:24-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
# Docker は HOSTNAME にコンテナ ID を入れるため、そのままだと server.js がその名前でしか待ち受けない。
# 0.0.0.0（すべてのネットワーク）で待ち受けて、コンテナの外からつながるようにする
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# standalone の中身（server.js と、追跡で選ばれた node_modules）。
# outputFileTracingRoot をリポジトリのルートにしているので、server.js は apps/web/server.js に入っている
# Next.js が実行中に .next/cache へ書き込むので、node ユーザーの持ち物にしておく
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
# .next/static と public は standalone に自動では入らないので、server.js から見た場所に手でコピーする
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public

# root ではなく、node イメージに用意されている一般ユーザーで動かす
USER node

# web が使うポート
EXPOSE 3000

# next start ではなく、standalone の server.js を node で直接起動する
CMD ["node", "apps/web/server.js"]
