import { updatePhrase } from "@/app/phrases/actions";
import { PhraseForm } from "@/components/phrases/phrase-form";
import { PhraseFormHeading } from "@/components/phrases/phrase-form-heading";
import { PhraseFormSkeleton } from "@/components/phrases/phrase-form-skeleton";
import { getMyPhrase } from "@/lib/phrases";
import { Suspense } from "react";

type EditPhraseProps = {
  params: Promise<{ id: string }>;
};

/**
 * 自分のフレーズの編集画面（/phrases/[id]/edit）。
 * 見出しは静的な殻に置き、params を使う部分だけを <Suspense> の中でリクエスト時に描画する。
 */
export default function EditPhrasePage({ params }: EditPhraseProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <PhraseFormHeading>フレーズを編集</PhraseFormHeading>
      <Suspense fallback={<PhraseFormSkeleton />}>
        <EditPhraseContent params={params} />
      </Suspense>
    </div>
  );
}

/**
 * リクエストごとに決まる部分。今の値を api から取り、フォームの初期値にする。
 * - ないフレーズは getMyPhrase が notFound() にし、[id]/not-found.tsx が表示される
 * - Client Component に渡す初期値は、フォームで使う項目だけに絞る
 */
async function EditPhraseContent({ params }: EditPhraseProps) {
  const { id } = await params;
  const phrase = await getMyPhrase(id, `/phrases/${id}/edit`);
  return (
    <PhraseForm
      action={updatePhrase.bind(null, phrase.id)}
      defaultValues={{
        phrase: phrase.phrase,
        meaning: phrase.meaning,
        example: phrase.example,
        context: phrase.context,
        note: phrase.note,
        source: phrase.source,
        sourceUrl: phrase.sourceUrl,
        isPublic: phrase.isPublic,
      }}
      submitLabel="保存"
      pendingLabel="保存中…"
      cancelHref={`/phrases/${phrase.id}`}
    />
  );
}
