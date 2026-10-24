import { requireSession } from "@/lib/session";
import { Suspense } from "react";

// 仮の画面。ステップ6で作り直す。

// リクエストごとに決まる部分（ログイン確認とユーザー情報）を担当する。
// requireSession は中で cookies() を読むため、必ず <Suspense> の内側で呼ぶ。
// 外で呼ぶと、静的な殻を作るビルド時にエラーになる。
async function PhrasesContent() {
  const session = await requireSession("/phrases");
  return <p>ログイン中: {session.email}</p>;
}

// 静的な殻。ビルド時に作られる見出しと <Suspense> だけを置く。
// <Suspense> の中身はリクエスト時に描画され、それまでは fallback が表示される。
export default function PhrasesPage() {
  return (
    <>
      <h1>Phrases</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <PhrasesContent />
      </Suspense>
    </>
  );
}
