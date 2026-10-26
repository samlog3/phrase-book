type PhraseListEmptyProps = {
  message: string;
};

/** フレーズが 0 件のときに、一覧の代わりに出すメッセージ。文は自分の一覧と公開一覧で変える */
export function PhraseListEmpty({ message }: PhraseListEmptyProps) {
  return <p>{message}</p>;
}
