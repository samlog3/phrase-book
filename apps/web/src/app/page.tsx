import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const features = [
  "意味・例文・使う場面・出典をまとめて保存できる",
  "フレーズごとに公開・非公開を切り替えられる",
  "公開されたフレーズは、ログインなしで誰でも見られる",
];

/**
 * トップページ（/）。アプリの紹介と、一覧へのリンクだけを置く。
 * - api を呼ばず、ログイン状態も見ないので、ビルド時に静的なページとして作られる
 * - 未ログインで「マイフレーズ」を押すと、Proxy が /login?redirect=/phrases へ移し、ログイン後に一覧へ戻る。
 *   そのため、ここではログイン状態でリンクを出し分けない
 * - 幅と余白は /phrases・/public の layout.tsx とそろえる
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-8 sm:max-w-xl lg:max-w-3xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">Phrase Book</h1>
        <p className="text-muted-foreground">
          出会った英語フレーズを保存するフレーズ帳
        </p>
      </div>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        <Link href="/phrases" className={buttonVariants({ size: "lg" })}>
          マイフレーズ
        </Link>
        <Link
          href="/public"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          公開フレーズを見る
        </Link>
      </div>
    </main>
  );
}
