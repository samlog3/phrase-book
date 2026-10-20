# API 仕様

## 基本

- ベースパス：`/api`（`http://localhost:8787/api`）
- リクエストとレスポンスは JSON
- 日時は ISO 8601 の文字列（例：`2026-10-17T06:00:00.000Z`）

## エンドポイント

自分用と公開用の 2 つに分ける。区画ごとに認可のルールを 1 つにするため。

### 自分用（`/api/phrases`）

すべてログイン必須で、自分のフレーズだけを扱う。

| メソッド | パス               | 内容 | 成功時                    |
| -------- | ------------------ | ---- | ------------------------- |
| GET      | `/api/phrases`     | 一覧 | 200 `{ items: Phrase[] }` |
| POST     | `/api/phrases`     | 作成 | 201 `Phrase`              |
| GET      | `/api/phrases/:id` | 詳細 | 200 `Phrase`              |
| PATCH    | `/api/phrases/:id` | 更新 | 200 `Phrase`（更新後）    |
| DELETE   | `/api/phrases/:id` | 削除 | 204（ボディなし）         |

### 公開用（`/api/public/phrases`）

ログイン不要で、公開されているフレーズだけを扱う。

| メソッド | パス                      | 内容     | 成功時                          |
| -------- | ------------------------- | -------- | ------------------------------- |
| GET      | `/api/public/phrases`     | 公開一覧 | 200 `{ items: PublicPhrase[] }` |
| GET      | `/api/public/phrases/:id` | 公開詳細 | 200 `PublicPhrase`              |

### 認証（`/api/auth/*`）※ステップ3 実装済み

Better Auth のハンドラに任せる。エラーのレスポンスも Better Auth の形のままになり、後述の「エラー」の形には揃えない。

### 補足

- 一覧は `createdAt` の降順で返す
- ページネーション（`?page=`、1 ページ 30 件）はステップ5で追加し、一覧のレスポンスに総件数などを足す。そのため一覧は最初から `{ items }` で包む
- 詳細・作成・更新はフレーズをそのまま返す（`{ data }` などで包まない）

## データの形

### Phrase

```json
{
  "id": 1,
  "userId": "u_abc123",
  "phrase": "break the ice",
  "meaning": "場の緊張をほぐす",
  "example": "He told a joke to break the ice.",
  "context": null,
  "note": null,
  "source": "Friends S1E3",
  "sourceUrl": null,
  "isPublic": false,
  "createdAt": "2026-10-17T06:00:00.000Z",
  "updatedAt": "2026-10-17T06:00:00.000Z"
}
```

- `userId` はフレーズを作成したユーザー。Better Auth の `User.id` に合わせて文字列にする
  - 作成時にログイン中のユーザーの ID を保存する。リクエストのボディで指定させない（送られても無視する）
  - ユーザーが削除されたら、そのユーザーのフレーズも削除される（`onDelete: Cascade`）

### PublicPhrase

`Phrase` から `note`（自分用のメモ）と `userId` を除いたもの。

- 他の項目（`isPublic`、`createdAt`、`updatedAt` を含む）はそのまま返す
- 除く項目は、取得後に落とすのではなく、Prisma の `select` で最初から取らない。カラムを足したときに `note` や `userId` が公開レスポンスに混ざるのを防ぐため

## リクエスト

### 項目と制約

| 項目        | 作成時 | 制約                               |
| ----------- | ------ | ---------------------------------- |
| `phrase`    | 必須   | 1〜100 文字                        |
| `meaning`   | 必須   | 1〜200 文字                        |
| `example`   | 任意   | 200 文字まで                       |
| `context`   | 任意   | 500 文字まで                       |
| `note`      | 任意   | 800 文字まで                       |
| `source`    | 任意   | 100 文字まで                       |
| `sourceUrl` | 任意   | http / https の URL、2048 文字まで |

- 文字列の項目は、次の順番で処理する
  1. 前後の空白を除く（必須・任意どちらも。除いた値を保存する）
  2. 任意項目で空文字（`""`）になったら `null` に変換する。フォームで未入力の項目が `""` で送られてくるため。空白だけの入力も、1 で `""` になるので `null` になる
  3. 上の表の制約をチェックする（文字数は空白を除いた後で数える。`sourceUrl` の URL のチェックも `null` に変換した後に行うので、`""` は 400 にならない）
- スキーマにないキーはエラーにせず、無視する（zod の `z.object` の標準の動き）
- `isPublic` は作成・更新ともに任意で、真偽値（`true` / `false`）だけを受け付ける
  - 作成時に送らなければ非公開（`false`）で保存する。更新時に送らなければ変更しない
  - `null` や真偽値以外は 400 にする。`null` を「空にする」と読ませる文字列の項目と違い、`isPublic` には空にする意味がないため
- 基本的に DB の上限より zod の上限を厳しくしている（`sourceUrl` は同じ 2048）。DB の制約は保存できる上限、zod の制約はアプリとして妥当な長さ
- スキーマは `@phrase-book/shared` に置き、web と api で共有する

### PATCH の意味

JSON Merge Patch（RFC 7396）と同じ考え方にする。

| 送り方             | 意味         |
| ------------------ | ------------ |
| キーがない         | 変更しない   |
| `null`（任意項目） | 空にする     |
| 値                 | その値にする |

- 必須項目（`phrase`、`meaning`）に `null` を送ると 400
- 空のオブジェクト `{}` は「何も変更しない」として扱い、200 で現在のフレーズを返す
  - このときは `update` を呼ばず、読む処理と同じく取得して返す（なければ 404）。`data: {}` で `update` すると、`updatedAt` が変わるか、存在しない ID で P2025 になるかが Prisma の挙動しだいになるため
- Prisma も `undefined` は「変更しない」、`null` は「NULL にする」として扱うため、検証後のデータをそのまま `update` に渡せる

### パスパラメータ `id`

- 10 進数の数字だけで、先頭は 0 でない（`/^[1-9][0-9]*$/`）
- かつ 2147483647 以下（MySQL の `INT` の上限）
- それ以外は 400（`01`、`1e3`、`0x10` なども 400 になる）

## エラー

### 形

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {
      "formErrors": [],
      "fieldErrors": {
        "phrase": ["Too small: expected string to have >=1 characters"]
      }
    }
  }
}
```

- `code`：エラーの種類。クライアントはこれを見て処理を分ける
- `message`：開発者向けの英語。画面に出す日本語はフロントが `code` から決める
- `details`：`VALIDATION_ERROR` のときだけ付ける。zod の `flattenError` の結果
- HTTP ステータスはステータス行で返すので、ボディには入れない

### コード一覧

コードの一覧は `@phrase-book/shared` に置き、web と api で共有する。

| code               | ステータス | message                 | いつ                                                                     |
| ------------------ | ---------- | ----------------------- | ------------------------------------------------------------------------ |
| `VALIDATION_ERROR` | 400        | `Invalid request`       | リクエストのバリデーションに失敗した、またはボディが JSON として読めない |
| `UNAUTHORIZED`     | 401        | `Unauthorized`          | ログインしていない ※ステップ3                                            |
| `NOT_FOUND`        | 404        | `Not found`             | リソースがない、または見る権限がない                                     |
| `INTERNAL_ERROR`   | 500        | `Internal server error` | 想定外のエラー                                                           |

- 500 のときは、エラーの中身（スタックトレースや Prisma のエラー文）をレスポンスに出さず、サーバーのログにだけ出す
- 存在しないパスも `NOT_FOUND` で返す
- ボディが JSON として読めない場合、`zValidator` は zod の検証の前に Hono の `HTTPException`（400）を投げる。`onError` でこれを `VALIDATION_ERROR` に変換し、`details` は同じ形にそろえて `{ "formErrors": ["Malformed JSON in request body"], "fieldErrors": {} }` とする（変換しないと 500 になる）
- Hono 本体やミドルウェアが投げる `HTTPException` は、次のように変換する
  - 400 → `VALIDATION_ERROR`。`formErrors` には `HTTPException` のメッセージを入れる（上の壊れた JSON はこのケース）。メッセージがなければ空の配列にする
  - 401 → `UNAUTHORIZED`
  - それ以外（413 など）→ コード一覧に対応するものがないので、想定外のエラーとして `INTERNAL_ERROR`（500）にする

### 判定の順番

**401（認証）→ 400（バリデーション）→ 404（存在と権限）** の順に判定する。ミドルウェアの順番（認証 → `zValidator` → ハンドラ）がそのままこの順番になる。

### 404 を返す場合

権限がない場合も 404 を返し、リソースが存在するかどうかを隠す。

| エンドポイント           | 404 になる条件                     |
| ------------------------ | ---------------------------------- |
| 自分用の詳細・更新・削除 | 存在しない、または自分のものでない |
| 公開用の詳細             | 存在しない、または公開されていない |

- 公開用は「存在しない」と「非公開」を区別せず、同じ 404 を返す。他人の非公開フレーズの存在を外から推測できないようにするため（自分用と同じ方針）
- 自分用の一覧は、自分のフレーズだけを返す（他人のフレーズは含まれない）
- 公開用の詳細は未ログインでも使えるので、401 は返さない

## 実装の方針

- 層は route → service → Prisma に分ける
  - route：パスの定義、バリデーション、service の呼び出し、レスポンスを返す。ハンドラはその場で書き、名前付きの関数に切り出さない（Hono の型推論を効かせるため）
  - service：ビジネスロジックと認可のチェック。`services/phrases.ts` に関数を並べて export する。Hono の `Context` は受け取らず、値だけを受け取る
- 認可（自分のフレーズだけを扱う）
  - route が `c.get("user").id` を取り出し、service に `userId` として渡す（引数の最後に置く）
  - service は、作成時に `data` へ `userId` を入れ、一覧・詳細・更新・削除では `where` に `userId` を入れる。「自分のものでない」と「存在しない」を区別せず、同じ 404 になる
- 公開用は自分用と分けて実装する
  - route：`routes/publicPhrases.ts`。`sessionMiddleware` はかけない
  - service：`services/publicPhrases.ts`。自分用の関数に `isPublic` の分岐を足さない（認可の条件を読みやすく保つため）
  - 一覧は `where: { isPublic: true }` を `createdAt` の降順で、詳細は `where: { id, isPublic: true }` で取得し、`null` なら `AppError`（404）を投げる
  - どちらも `select` で `note` と `userId` を取らない
  - `app.ts` では `/api/public/phrases` にマウントする。未ログインで 200 が返ることをテストで確かめる。テストでは `auth.api.getSession` を何も返さない（未ログイン扱いの）モックに差し替え、200 になることと `getSession` が呼ばれないことを見る（ミドルウェアがかかっていれば 401 になる）
- Hono RPC のために、ルートはメソッドをつなげて書き、`app.route()` の戻り値から `AppType` を作る
- 認証のミドルウェア（`middleware/auth.ts`）は、ログイン必須のルーターの中で `.use()` してかける（例：`routes/phrases.ts`）
  - `app.ts` の `app.use()` や、`/api` にマウントした親ルーターの `.use()` ではかけない。Hono の `app.route()` は子ルーターのミドルウェアをマウント先のパス（`/api/*`）に登録し直すため、同じ `/api` の下にある `/api/public` や `/api/auth` にもかかってしまう
  - ルーターの中でかけると、ハンドラの `c.get("user")` にミドルウェアの型が付く
- エラーは自前の `AppError`（`status`・`code`・`message`）で投げ、`app.onError` でレスポンスの形に変換する
- `zValidator` は hook の中で throw するラッパーを作って使い、バリデーションエラーも `onError` にまとめる
- 404 の判定
  - 読む処理：`where: { id, userId }` で取得して `null` なら `AppError` を投げる
  - 更新・削除：`where: { id, userId }` で `update` / `delete` を直接実行し、Prisma の P2025 を **service の中で** `AppError`（404）に変える。それ以外のエラーはそのまま投げ直す
    - 他人のフレーズは条件に合うレコードがないので、存在しない ID と同じ P2025 になる
    - `update` / `delete` の `where` に `id` 以外の項目を足せるのは Prisma 5 以降
