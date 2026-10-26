# web の作り（データの流れ）

## 前提

- web（Next.js）は UI だけを持ち、DB には触らない。データの読み書きはすべて api（Hono）に任せる
- api が「データを守る本体」で、セッションと本人のデータかどうかは api が確かめる（[auth.md](auth.md)）
- web のサーバー（Server Component・Server Action）は、ブラウザと api の間に立つ窓口（BFF）として使う

## 全体像

```
ブラウザ
  │
  │ ① 画面を開く（GET） / ② フォームを送る（Server Action の POST）
  ▼
web:3000（Next.js のサーバー）
  │  Proxy                  Cookie があるかだけ見る
  │  Server Component       読み込み：RPC で api を呼ぶ（Cookie を転送する）
  │  Server Action          書き込み：RPC で api を呼ぶ（Cookie を転送する）
  │
  │ ③ RPC（hc<AppType>）
  ▼
api:8787（Hono）              セッションと本人かを確かめて、DB を読み書きする

例外：認証（サインアップ・ログイン・ログアウト）だけは、ブラウザの Client Component から
Better Auth のクライアントで api に直接送る（CORS を通る）
```

## 役割の分担

| 部品 | どこで動くか | 担当すること | api の呼び方 |
| --- | --- | --- | --- |
| Proxy | web のサーバー | 未ログインを `/login` へ移す入口のチェック | 呼ばない |
| Server Component | web のサーバー | データの読み込みと画面の組み立て | RPC。Cookie を転送する |
| Server Action | web のサーバー | 作成・編集・削除と、その後の移動・画面の更新 | RPC。Cookie を転送する |
| Client Component | ブラウザ | 入力・クリックなどの操作と、その場の表示の切り替え | 呼ばない（Server Action を呼ぶ） |
| Better Auth のクライアント | ブラウザ（とサーバー） | 認証と、セッションの確認 | 直接。ブラウザでは Cookie が自動で付く |

## 使い分けのルール

### Server Component を基本にする

- ページは Server Component で書き、データはサーバーで取ってから HTML にする
- 次のどれかが必要な部分だけを Client Component（`"use client"`）に切り出す
  - `useState` などの状態
  - `onClick`・`onChange` などのイベント
  - ブラウザだけにある API
- Client Component はなるべく小さく、画面の葉の部分に置く（フォーム、削除ボタンなど）
- Server Component から Client Component に渡す props は、シリアライズできる値で、必要なものだけにする（`getSession` が `{ userId, email }` だけを返すのと同じ考え方）

### 読み込みは Server Component、書き込みは Server Action

| やりたいこと | 書く場所 |
| --- | --- |
| 一覧・詳細を表示する | Server Component で api を呼ぶ |
| 作成・編集・削除する | Client Component のフォームやボタンから Server Action を呼び、Server Action が api を呼ぶ |
| 認証する | Client Component から Better Auth のクライアントで直接呼ぶ |

### 理由

- **フレーズの api を呼ぶ道を 1 本にするため。** 読み込みも書き込みも「web のサーバーから Cookie を転送して RPC で呼ぶ」になるので、RPC クライアントはサーバー用の 1 つで済み、`server-only` で閉じられる
- **書き込みの後の処理を 1 か所にまとめるため。** 保存 → 画面の更新 → 移動を Server Action の中で書け、1 回の往復で済む
- **認証だけ例外にするのは、Cookie を発行するのが Better Auth だから。** ログインのレスポンスの `Set-Cookie` をブラウザに直接受け取らせるため、ブラウザから api へ送る

### 型の置き場所

| 型の種類 | 置き場所 |
| --- | --- |
| api のレスポンスから作る型（例: `PhraseListItem`） | `apps/web/src/lib/api-types.ts` に集める。`InferResponseType` で api の型から作る |
| コンポーネントの props の型 | そのコンポーネントのファイル。`Pick` で使う項目だけを宣言し、export しない |

- フレーズの型を web で手書きしない。正しい型は api が持っているので、web はそこから作るだけにする（手書きすると、`id` が `number` か `string` かのようなずれが起きる）
- props を `Pick` で絞るのは、型を見ればそのコンポーネントが何を使うかわかるようにするため。余分な項目があっても渡せるので、ページからは api の結果をそのまま渡せる
- `api-types.ts` は `server-only` の `api-client.ts` を `import type` でだけ参照する。型は実行時に消えるので、Client Component から `api-types.ts` の型を使っても問題ない

### ファイルの置き場所

| 種類 | 置き場所 |
| --- | --- |
| フレーズの画面で使う部品 | `apps/web/src/components/phrases/` |
| フレーズの Server Action | `apps/web/src/app/phrases/actions.ts`（先頭に `"use server"`） |
| フォームの検証と、Server Action の戻り値の型 | `apps/web/src/lib/schemas/phrase.ts`（ブラウザと Server Action の両方から使う） |
| 複数の画面で使うサーバー専用の処理（`getMyPhrase` など） | `apps/web/src/lib/phrases.ts`（`server-only`） |
| 複数の画面で使う部品（ヘッダーなど） | `apps/web/src/components/` の直下 |

- Client Component は `actions.ts` の関数を import して呼ぶだけにする。`api-client.ts` は `server-only` なので、Client Component からは import できない
- `"use server"` のファイルから export できるのは async 関数だけなので、戻り値の型や初期値は `actions.ts` に置かず `lib/schemas/phrase.ts` に置く

### Server Action の戻り値（作成・編集）

作成（`createPhrase`）と更新（`updatePhrase`）は、`useActionState` から呼ぶ形（`(prevState, formData) => Promise<PhraseFormState>`）にする。

| 結果 | 戻り値 | 画面での表示 |
| --- | --- | --- |
| 成功 | 返さない。`redirect` で詳細（`/phrases/{id}`）へ移動する | 詳細画面 |
| 入力の誤り | `{ status: "invalid", fieldErrors }` | 項目ごとに、入力欄の下に出す |
| 想定外の失敗 | `{ status: "error", message }` | フォームの上にまとめて出す |
| まだ送っていない | `{ status: "idle" }`（`useActionState` の初期値） | 何も出さない |

- 成功のときに値を返さないのは、保存 → 画面の更新 → 移動を Server Action の中で 1 回の往復で済ませるため
- 想定外の失敗（api が落ちているなど）も throw せずに返す。`error.tsx` に行くと、入力した内容が消えてしまうため。削除はボタンだけで入力がないので、これまでどおり throw して `error.tsx` に任せる
- `fieldErrors` の形は `z.flattenError(...).fieldErrors` と同じにし、ブラウザの検証と api の 400 のどちらから来ても同じように表示する

### フォームの検証

- shared の `createPhraseSchema` を、`parsePhraseForm`（`lib/schemas/phrase.ts`）でブラウザと Server Action の両方から使う
  - ブラウザ：送る前に確かめ、誤りがあれば Server Action を呼ばずにその場で出す
  - Server Action：外から直接呼ばれても確かめる（api でも確かめるが、無駄なリクエストを送らない）
- shared のスキーマには日本語のメッセージを書かない（api と共有していて、api のメッセージは英語のため）。web で parse するときだけ、`safeParse(data, { error })` でエラーマップを渡して日本語にする
- 編集でもフォームは全項目を送るので、`createPhraseSchema` で検証する。空にした任意項目は `null` になり、PATCH で「空にする」として扱われる
- api が 400 を返したときは、`details.fieldErrors` のキーのうちフォームにある項目に「入力内容が正しくありません」を出す。api のメッセージは開発者向けの英語なので、そのままは出さない
- `<form action>` には渡さず、`onSubmit` で `preventDefault` してから `startTransition` の中で `useActionState` の関数を呼ぶ。`<form action>` だと送ったあとに React がフォームを初期値に戻し、エラーのときに入力が消えるため

### 前の画面が残ること（Activity）とフォーム

`cacheComponents` が有効だと、移動した後も前の画面（直近 3 ルートまで）は消えずに React の `<Activity>` で隠れて残る。入力やエラー表示もそのまま残るので、フォームでは次のようにする。

| 場面 | 起きること | 対応 |
| --- | --- | --- |
| 作成・編集で保存できた後 | もう一度開くと、前の入力やエラーが残っている | `PhraseForm` が、送ってから値が返らないまま（redirect して）画面が隠れたら、`key` を変えてフォームを作り直す |
| 編集を保存した後 | 隠れている編集画面に新しい値が届いても、入力欄は古いまま。Switch は初期値が変わったと警告を出す | 編集画面で `key={phrase.updatedAt}` を付け、値が変わったら作り直す |
| 保存できなかったとき・保存せずに離れたとき | 入力が残る | そのままにする（書きかけを失わないため） |

### 書き込みの後の画面の更新

作成・更新・削除の後は `revalidatePath("/phrases", "layout")`（`actions.ts` の `revalidatePhrases`）を `redirect` の前に呼ぶ。

| 候補 | 使わない・使う理由 |
| --- | --- |
| `updateTag` | `"use cache"` と `cacheTag` で保存したデータを消すもの。一覧・詳細は Cookie を読んでリクエストごとに取っていて、タグの付いたキャッシュがないので、消すものがない |
| `refresh()` | 今いる画面（作成・編集・詳細）を取り直すだけで、前に開いた一覧や詳細のブラウザ側のキャッシュは残る。保存後は `redirect` で別の画面へ移るので合わない |
| `revalidatePath` | 使う。`layout` を付けて `/phrases` に呼ぶと、一覧・詳細・編集の画面をまとめて取り直す。一覧（タイトルや公開バッジ）と詳細の両方が変わり、削除では消したフレーズの詳細・編集も古いまま残さないよう、`/phrases` 以下をまとめて対象にする |

- 後で一覧・詳細を `"use cache"` で保存するようにしたら、`cacheTag` を付けて `updateTag` に切り替える

### api のエラーの扱い

| 場面 | api のステータス | web での扱い |
| --- | --- | --- |
| 詳細の取得 | 404（存在しない・他人のフレーズ）、400（0 で始まる・大きすぎる ID） | `notFound()` で `not-found.tsx` を出す |
| 削除 | 404（別のタブで先に削除していたなど） | 消したいものはもうないので、成功と同じく一覧へ戻す |
| 削除 | 401（詳細画面を開いている間にセッションが切れた） | ログイン後に詳細へ戻れるよう `/login?redirect=/phrases/{id}` へ移動する |
| 編集画面の表示 | 404・400 | 詳細と同じく `notFound()` で `[id]/not-found.tsx` を出す |
| 作成・更新 | 400（入力の誤り） | `{ status: "invalid" }` を返し、項目ごとに出す |
| 作成・更新 | 401（入力中にセッションが切れた） | ログイン後にフォームへ戻れるよう `/login?redirect=/phrases/new`（更新なら `/phrases/{id}/edit`）へ移動する |
| 更新 | 404（別のタブで削除していたなど） | `{ status: "error" }` で「見つかりません」と出す |
| 作成・更新 | 上以外（500 など）、api に届かない | throw せず `{ status: "error" }` を返し、入力を残したまま出す |
| 取得・削除 | 上以外（500 など） | throw して `error.tsx` に任せる |

- 数字でない ID は、api に問い合わせる前に web で `notFound()` にする。URL から来た値を `requireSession` の `returnTo` にそのまま渡さないため
- 404 と 400 を区別せず Not Found にするのは、どちらも URL として「ないページ」だから。他人のフレーズかどうかも区別しない（あることを知られないため）
- api は 404 などを AppError で投げて返すので、RPC の型には成功時のステータスしか載っていない。比べるときは `const status: number = res.status` と受け直す

### 幅と余白は layout.tsx が決める

- ページの幅と余白は、`app/phrases/layout.tsx` のような `layout.tsx` に置く。一覧などの部品は並べ方（`flex`・`gap`）だけを決める
- `layout.tsx` は `loading.tsx`・`error.tsx`・`page.tsx` の外側に置かれるので、読み込み中・エラー・0 件のどの状態でも同じ幅になる。部品ごとに書くと、状態が切り替わったときに位置がずれる

## Cookie の流れ

| 呼び出し | Cookie の付け方 |
| --- | --- |
| ブラウザ → web | ブラウザが自動で付ける（Cookie はポートを区別しないため、api の Cookie も付く） |
| web のサーバー → api | 自動では付かない。`cookies()` で読んだ値を `cookie` ヘッダーに入れて転送する |
| ブラウザ → api（認証だけ） | `credentials: "include"` で付ける。api の CORS で `credentials: true` と origin の明示が必要 |

- RPC クライアントは `apps/web/src/lib/api-client.ts` にまとめる（`server-only`）
  - 自分用の画面は `getApiClient()` を使う。呼ぶたびに `cookies()` を読んで転送するので、`<Suspense>` の内側で呼ぶ
  - 公開画面は `publicApiClient` を使う
- 転送するのは `cookie` ヘッダーだけにする（`host` などは送らない）
- 公開画面（`/public`、`/public/[id]`）は Cookie なしで api を呼ぶ

## 画面ごとの割り当て

| 画面 | Server Component | Client Component | Server Action |
| --- | --- | --- | --- |
| `/phrases` | 一覧を取る（作成へのリンク） | なし | なし |
| `/phrases/[id]` | 詳細を取る（作成・編集へのリンク） | 削除ボタン（確認） | 削除 → 一覧へ移動 |
| `/phrases/new` | ログインを確かめる | フォーム | 作成 → 詳細へ移動 |
| `/phrases/[id]/edit` | 今の値を取る | フォーム（初期値つき） | 更新 → 詳細へ移動 |
| `/public`、`/public/[id]` | 公開フレーズを取る（Cookie なし） | なし | なし |
| `/login`、`/signup` | ログイン済みなら移す | フォーム（Better Auth のクライアント） | なし |

## 注意すること

- **Server Action は誰でも呼べる POST の入口になる。** 画面にボタンがあるかどうかに関係なく、外から直接呼ばれる前提で書く。このアプリでは、認証と本人のデータかどうかは api が確かめる
- **想定内の失敗（バリデーションエラーなど）は、Server Action から値として返す。** throw すると `error.tsx` に行ってしまう
- **`redirect()` と `notFound()` は例外を投げて動く。** `try/catch` の中で呼ばない
- **`cacheComponents` が有効なので、`cookies()` を読む処理は `<Suspense>` の内側に置く。** api を Cookie つきで呼ぶ Server Component も同じ
- **画面の状態は、ファイルで分けて用意する。** `loading.tsx`（読み込み中）、`error.tsx`（想定外のエラー）、`not-found.tsx`（api の 404 を `notFound()` につないだとき）
- **`error.tsx` の再読み込みには `retry` を使う。** `reset` はエラーの状態を消して描画し直すだけで、サーバーにデータを取りに行かない。`retry` は `router.refresh()` で取り直してから `reset` するので、api が復旧していれば画面が戻る