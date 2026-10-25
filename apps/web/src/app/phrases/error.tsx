"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function PhraseError({ error, retry }: ErrorProps) {
  // 画面には出さず、開発中に原因を追えるようブラウザのコンソールに残す
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <p>フレーズの読み込みに失敗しました</p>
      <Button onClick={retry}>再読み込み</Button>
    </div>
  );
}
