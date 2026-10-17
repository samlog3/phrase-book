# 英語フレーズ帳アプリ 概要

## 目的

- 入社前課題として、配属先の技術スタック（TypeScript / React / Next.js / Hono / MySQL / ORM）を一通り経験する
- CRUD、認証、認可を自分の手で実装し、実務に近い構成（フロントとAPIを分離）で開発する流れを身につける
- 題材は、自分が出会った英語フレーズを保存する「フレーズ帳」とする

## 達成したいこと

### 技術面

- Next.js（App Router）でServer ComponentとClient Componentを使い分ける
- Honoで型安全なAPIを作り、Hono RPCでフロントと型を共有する
- Prismaでスキーマ設計とマイグレーションを管理する
- Better Authでセッションベースの認証を実装する
- 別オリジン構成でのCORSとCookieの扱いを理解する

### 品質面

- エラーレスポンスの形とステータスコードを統一する
- バリデーション（zod）をサーバーとフロントで共有する
- 認可漏れがないことをテストで保証する
- 設計の理由を説明できる状態にする（READMEに記載）

## スコープ

目標：ローカル環境で一通り動く状態まで（約7日）

### 対象

| 区分 | 内容 |
|---|---|
| 認証 | サインアップ、ログイン、ログアウト |
| フレーズ | 作成、一覧、詳細、編集、削除 |
| 認可 | 自分のフレーズのみ編集・削除できる |
| 公開設定 | 公開・非公開の切り替え、公開フレーズ一覧（閲覧は誰でも可能） |
| ページネーション | 自分の一覧と公開一覧。offset方式、1ページ30件、作成日時の新しい順 |
| 画面保護 | 未ログイン時に保護された画面へアクセスした場合の制御。方式は調査の上で設計する |
| 画面状態 | ローディング、エラー、Not Found の表示（`loading.tsx` / `error.tsx` / `not-found.tsx`） |
| テスト | APIのテスト（認証・認可を中心に） |

### 対象外

- メール認証、パスワードリセット
- 検索
- フロントエンドのテスト

### 今後の拡張

- タグ（ユーザーごと、多対多）
- CI（lint、型チェック、テスト）
- AWSへのデプロイ

## 技術スタック

| 領域 | 技術 |
|---|---|
| 言語 | TypeScript |
| フロント | Next.js（App Router）、React、shadcn/ui |
| API | Hono（`@hono/node-server`）、Hono RPC |
| DB / ORM | MySQL（Docker Compose）、Prisma（MySQL用のdriver adapter） |
| 認証 | Better Auth（Prisma adapter、メールアドレスとパスワード） |
| バリデーション | zod、`@hono/zod-validator` |
| テスト | Vitest（Honoの `app.request()` を使ったAPIテスト） |
| 構成管理 | pnpm workspaces（モノレポ） |

## 構成

```
phrase-book/
  apps/
    web/                   Next.js (localhost:3000)  ← UI。セッションの確認のみ行う
    api/                   Hono + Prisma + Better Auth (localhost:8787)
      src/
        routes/            ルーティングとリクエストのバリデーション
        services/          ビジネスロジックと認可のチェック
        middleware/        セッションの検証など
        lib/               Prisma・Better Auth の初期化
        generated/prisma/  Prisma Client の生成物（git 管理外）
        app.ts             Hono アプリの定義。AppType を export
        index.ts           app を読み込んで serve() で起動する
      prisma/
        schema.prisma
      prisma.config.ts     Prisma の設定（接続 URL など）
  packages/
    shared/                web と api で共有するコード（@phrase-book/shared）
      src/
        schemas/           zod スキーマ
        constants.ts       PAGE_SIZE などの定数
        index.ts
  compose.yaml             MySQL
  pnpm-workspace.yaml      apps/*, packages/*
  tsconfig.base.json       共通のコンパイラ設定
  package.json             dev / test / lint をまとめて実行するスクリプト
```

- `app.ts` と `index.ts` を分けるのは、テストで `app.request()` を使うときに、サーバーを起動せずにアプリの定義だけを import するため

- webはapiの `AppType` を**型としてのみ**importし、RPCクライアントで呼び出す
- 認証はCookieによるセッション方式とする。CORSは `origin` を明示し、`credentials: true` を指定する
- Server ComponentからAPIを呼ぶときは、Cookieを手動で転送する
- API内部は「route → service → Prisma」の軽い分け方にする

## データモデル

```
User / Session / Account   ← Better Authが生成

Phrase
  id, userId(FK), phrase, meaning, example?, context?, note?,
  source?, sourceUrl?, isPublic (default false), createdAt, updatedAt
  index: (userId, createdAt), (isPublic, createdAt)

Tag          ※今後の拡張
  id, userId(FK), name
  unique: (userId, name)

PhraseTag    ※今後の拡張・明示（explicit）の中間テーブル
  phraseId(FK), tagId(FK), createdAt
  PK: (phraseId, tagId) / onDelete: Cascade
```

### 設計メモ

- Phrase の各項目の役割は次のとおり。どこに何を書くか迷わないように分ける
  - `example`：例文（どう使うか）
  - `context`：使う場面やニュアンス（いつ使うか）
  - `note`：自分用の自由なメモ
  - `source`：どこで見つけたか（「Friends S1E3」「同僚との会話」など、URL がないものも書ける）
  - `sourceUrl`：見つけた場所の URL
- `source` と `sourceUrl` を分けるのは、URL にだけ厳しいチェックをかけるため。`sourceUrl` は画面で `<a href>` として表示するので、`javascript:` などを入れられると XSS になる。zod の `z.httpUrl()` で http / https だけを許可する（`z.url()` だけでは `javascript:` も通ってしまう）
- MySQL の型：`String` はそのままだと `VARCHAR(191)` になる。`example`・`context`・`note` は `@db.Text`、`sourceUrl` は `@db.VarChar(2048)` にする
- `userId` は、Better Auth を入れて `User` テーブルができてから（ステップ3・4）マイグレーションで追加する。ステップ1のマイグレーションには含めない
- 多対多は明示（explicit）の中間テーブルにする。中間テーブルにカラムを追加でき、SQLとの対応が見えるため
- タグはユーザーごとに持つ。フレーズに紐付けるときは、`phraseId` と `tagId` がどちらも自分のものかをサービス層でチェックする

## API

| メソッド | パス | 内容 | 認可 |
|---|---|---|---|
| * | `/api/auth/*` | Better Auth | ― |
| GET | `/phrases?page=` | 自分のフレーズ一覧 | ログイン必須 |
| GET | `/phrases/public?page=` | 公開フレーズ一覧 | なし |
| GET | `/phrases/:id` | 詳細 | 本人のもの、または公開されているもの |
| POST | `/phrases` | 作成 | ログイン必須 |
| PATCH | `/phrases/:id` | 更新 | 本人のみ |
| DELETE | `/phrases/:id` | 削除 | 本人のみ |

- 権限がない場合は**404を返す**（リソースが存在するかどうかを隠すため）。未ログインなら401
- エラーは `{ error: { code, message } }` の形に統一する
- 一覧は1ページ30件、`createdAt` の降順で返す

## 画面

| パス | 内容 | ログイン |
|---|---|---|
| `/signup` | サインアップ | 不要 |
| `/login` | ログイン | 不要 |
| `/phrases` | 自分のフレーズ一覧 | 必須 |
| `/phrases/new` | 新規作成 | 必須 |
| `/phrases/[id]` | 詳細 | 公開フレーズは不要 |
| `/phrases/[id]/edit` | 編集 | 必須 |
| `/public` | 公開フレーズ一覧 | 不要 |

## 進める順番

### 1. 開発基盤の構築

- pnpm workspacesでモノレポを作る（`apps/web`、`apps/api`）
- Docker ComposeでMySQLを起動する
- Prismaを導入し、`Phrase` のスキーマを作成してマイグレーションする
- Honoを起動する

**完了条件**：`docker compose up` と `pnpm dev` でwebとapiが起動し、DBにテーブルが作られている

### 2. フレーズCRUD API

- `/phrases` のCRUDエンドポイントを実装する（この時点では認証なし）
- zodでリクエストをバリデーションする。スキーマをフロントと共有する方法を決める
- エラーレスポンスの形とステータスコードを統一する（共通のエラーハンドラ）
- route → service → Prisma の層に分ける

**完了条件**：curlなどで作成・一覧・詳細・更新・削除ができ、不正な入力に400、存在しないIDに404が返る

### 3. 認証API

- Better Authをapiに導入する（Prisma adapter、メールアドレスとパスワード）
- CORSを設定する（`origin` を明示し、`credentials: true` を指定する）
- セッションを検証するミドルウェアを作り、未ログイン時は401を返す

**完了条件**：サインアップ・ログイン・ログアウトができ、ログインしていないとフレーズAPIが401を返す

### 4. 認可と公開設定

- フレーズの作成時に `userId` を保存し、本人のフレーズのみ更新・削除できるようにする
- 権限がない場合は404を返す
- `isPublic` による公開・非公開を実装し、公開フレーズは誰でも詳細を取得できるようにする
- 公開フレーズ一覧API（`/phrases/public`）を実装する

**完了条件**：他人のフレーズを更新・削除・取得しようとすると404になり、公開フレーズは未ログインでも取得できる

### 5. ページネーション

- 自分の一覧と公開一覧に、offset方式のページネーションを実装する（1ページ30件、`createdAt` の降順）
- `page` の値をバリデーションする

**完了条件**：`page` の指定で取得範囲が切り替わり、ページ情報（総件数など）がレスポンスに含まれる

### 6. 認証画面と画面保護

- サインアップ・ログイン画面を作り、ログアウトできるようにする
- Better Authのクライアントからapiにリクエストし、Cookieが保存されることを確認する
- 画面保護の方式を調査・設計し、実装する

**完了条件**：未ログインで保護された画面を開くとログイン画面に移動し、ログイン後は元の画面を利用できる

### 7. フレーズ画面

- Hono RPCクライアントでAPIを呼び出す（Server Componentからの呼び出し時はCookieを転送する）
- 一覧・新規作成・詳細・編集・削除・公開一覧の画面を作る
- ページネーションのUIを作る
- `loading.tsx` / `error.tsx` / `not-found.tsx` を用意する

**完了条件**：画面からフレーズの作成から削除まで一通り操作でき、ローディング・エラー・Not Foundが表示される

### 8. APIテスト

- Vitestと `app.request()` でテストの環境を作る（テスト用DBの扱いを含む）
- 認証：未ログイン時に401が返ること
- 認可：他人のフレーズの更新・削除・取得で404が返ること
- 公開設定：非公開のフレーズが他人や未ログインのユーザーから見えないこと
- バリデーション：不正な入力で400が返ること

**完了条件**：`pnpm test` で上記のテストがすべて通る

### 9. README

- セットアップ手順と起動方法
- 設計の判断と理由（構成、認可で404を返す理由、中間テーブルの方針、画面保護の方式など）

**完了条件**：READMEの手順だけで、他の人がローカルで起動できる
