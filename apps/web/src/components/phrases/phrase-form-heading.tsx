type PhraseFormHeadingProps = {
  children: string;
};

/**
 * 作成・編集の画面の見出し。page.tsx と loading.tsx で同じものを出し、読み込みが終わったときの位置のずれを防ぐ。
 */
export function PhraseFormHeading({ children }: PhraseFormHeadingProps) {
  return <h1 className="text-xl font-semibold sm:text-2xl">{children}</h1>;
}
