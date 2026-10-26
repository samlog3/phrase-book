import { PhraseNotFound } from "@/components/phrases/phrase-not-found";

/**
 * 公開詳細（page.tsx）で notFound() を呼んだときの画面。存在しない ID と非公開のフレーズの ID で表示される。
 */
export default function PublicPhraseNotFound() {
  return <PhraseNotFound backHref="/public" />;
}
