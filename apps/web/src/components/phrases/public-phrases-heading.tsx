/**
 * 公開一覧（/public）の見出し。page.tsx と loading.tsx の両方に置き、読み込みの前後で位置をそろえる。
 * ログインしていない人も開く画面なので、/phrases と違って見出しを画面に出す。
 */
export function PublicPhrasesHeading() {
  return (
    <h1 className="text-xl font-semibold sm:text-2xl">公開フレーズ</h1>
  );
}
