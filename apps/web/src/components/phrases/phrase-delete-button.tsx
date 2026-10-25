"use client";
import { deletePhrase } from "@/app/phrases/actions";
import { Button } from "../ui/button";
import { useTransition } from "react";
type PhraseDeleteButtonProps = { id: number };

/**
 * 詳細画面の削除ボタン。確認してから Server Action の deletePhrase を呼ぶ。
 * - クリックと確認ダイアログを扱うので Client Component にする。カード本体は Server Component のまま
 * - 削除が終わるまで isPending でボタンを無効にし、2 回押されるのを防ぐ
 * - 削除後の移動は Server Action の redirect に任せるので、ここでは何もしない
 */
export function PhraseDeleteButton({ id }: PhraseDeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm(`本当に削除しますか？`)) return;
    // async の関数を渡して中で await すると、終わるまで isPending が true のままになる
    startTransition(async () => {
      await deletePhrase(id);
    });
  }
  return (
    <Button onClick={onClick} disabled={isPending} variant="destructive">
      {isPending ? "削除中…" : "削除"}
    </Button>
  );
}
