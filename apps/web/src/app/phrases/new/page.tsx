import { createPhrase } from "@/app/phrases/actions";
import { PhraseForm } from "@/components/phrases/phrase-form";
import { PhraseFormHeading } from "@/components/phrases/phrase-form-heading";
import { PhraseFormSkeleton } from "@/components/phrases/phrase-form-skeleton";
import { requireSession } from "@/lib/session";
import { Suspense } from "react";

/**
 * フレーズの作成画面（/phrases/new）。
 * 見出しは静的な殻に置き、ログインを確かめる部分だけを <Suspense> の中でリクエスト時に描画する。
 */
export default function NewPhrasePage() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <PhraseFormHeading>フレーズを作成</PhraseFormHeading>
      <Suspense fallback={<PhraseFormSkeleton />}>
        <NewPhraseContent />
      </Suspense>
    </div>
  );
}

/**
 * リクエストごとに決まる部分。表示する前にログインを確かめる。
 * - 取るデータはないが、セッションが切れたまま入力して、送ったときに内容が消えるのを防ぐため
 */
async function NewPhraseContent() {
  await requireSession("/phrases/new");
  return (
    <PhraseForm
      action={createPhrase}
      submitLabel="作成"
      pendingLabel="作成中…"
      cancelHref="/phrases"
    />
  );
}
