import { PhraseNotFound } from "@/components/phrases/phrase-not-found";

/**
 * 詳細（page.tsx）と編集（edit/page.tsx）で notFound() を呼んだときの画面。存在しない ID と他人のフレーズの ID で表示される。
 */
export default function MyPhraseNotFound() {
  return <PhraseNotFound backHref="/phrases" />;
}
