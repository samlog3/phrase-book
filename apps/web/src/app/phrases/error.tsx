// error.tsx はブラウザでボタンを押せる必要があるため、Client Component でなければならない
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * /phrases 以下で想定外のエラー（api が落ちているなど）が起きたときの画面。
 * 一覧・詳細の読み込みと削除の失敗のどれでも出るので、文言はどれにも合うものにしている。
 * 「再読み込み」では reset ではなく retry を呼ぶ。reset は描画し直すだけでデータを取りに行かないが、
 * retry は router.refresh() でサーバーから取り直すので、api が復旧していれば一覧に戻る。
 */
export default function PhraseError({ error, retry }: ErrorProps) {
  // 画面には出さず、開発中に原因を追えるようブラウザのコンソールに残す
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <p>問題が発生しました。時間をおいてもう一度お試しください</p>
      <Button onClick={retry}>再読み込み</Button>
    </div>
  );
}
