import type { ReactNode } from "react";
import type { PhraseDetail } from "@/lib/api-types";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PhraseDetailCardProps = {
  phrase: Pick<
    PhraseDetail,
    | "phrase"
    | "meaning"
    | "example"
    | "context"
    | "source"
    | "sourceUrl"
    | "isPublic"
  > &
    // 公開用の api は note を返さないので、なくても渡せるようにする
    Partial<Pick<PhraseDetail, "note">>;
  // 公開中なら「公開」のバッジを出すか
  showPublicBadge: boolean;
  // カードの下に並べるボタン（編集・削除など）。渡さなければフッターを出さない
  actions?: ReactNode;
};

/**
 * 詳細画面（/phrases/[id]、/public/[id]）のカード。フレーズを見出しにして、各項目を「項目名と値」の組で並べる。
 * - 任意項目は値があるものだけを出す
 * - 入力した改行がそのまま見えるよう、値は whitespace-pre-wrap で表示する
 * - 編集・削除は自分の詳細だけで出すので、カードには持たせず actions で外から渡す
 */
export function PhraseDetailCard({
  phrase,
  showPublicBadge,
  actions,
}: PhraseDetailCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {/* ページの見出しはフレーズ名にする */}
          <h1 className="text-xl font-semibold sm:text-2xl">
            {phrase.phrase}
          </h1>
        </CardTitle>
        {showPublicBadge && phrase.isPublic && (
          <CardAction>
            <Badge>公開</Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-4 text-sm sm:text-base py-2">
          <DetailItem label="意味">{phrase.meaning}</DetailItem>
          {phrase.example && (
            <DetailItem label="例文">{phrase.example}</DetailItem>
          )}
          {phrase.context && (
            <DetailItem label="使う場面">{phrase.context}</DetailItem>
          )}
          {phrase.note && <DetailItem label="メモ">{phrase.note}</DetailItem>}
          {(phrase.source || phrase.sourceUrl) && (
            <DetailItem label="出典">
              <Source source={phrase.source} sourceUrl={phrase.sourceUrl} />
            </DetailItem>
          )}
        </dl>
      </CardContent>
      {actions && (
        <CardFooter className="justify-end gap-2">{actions}</CardFooter>
      )}
    </Card>
  );
}

type DetailItemProps = {
  label: string;
  children: ReactNode;
};

/** 項目名（dt）と値（dd）の 1 組。 */
function DetailItem({ label, children }: DetailItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-muted-foreground sm:text-sm">
        {label}
      </dt>
      <dd className="wrap-break-word whitespace-pre-wrap">{children}</dd>
    </div>
  );
}

type SourceProps = Pick<PhraseDetail, "source" | "sourceUrl">;

/**
 * 出典の表示。URL があればリンクにし、出典名があればそれをリンクの文字にする。
 * 別のサイトなので新しいタブで開き、rel で開いた先からこのページを操作されないようにする。
 */
function Source({ source, sourceUrl }: SourceProps) {
  if (!sourceUrl) return source;

  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      // URL は途中に区切りがなく長いので、どこでも折り返せるようにする
      className="break-all text-primary underline underline-offset-4 hover:no-underline"
    >
      {source ?? sourceUrl}
    </a>
  );
}
