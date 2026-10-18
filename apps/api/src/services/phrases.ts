import type { CreatePhraseInput } from "@phrase-book/shared";
import { prisma } from "../lib/prisma.js";

/**
 * フレーズを作成し、作成したフレーズを返す。
 *
 * @param input `createPhraseSchema` で検証・変換した後の値（任意項目の `""` は `null` になっている）
 */
export async function createPhrase(input: CreatePhraseInput) {
  const result = await prisma.phrase.create({
    data: input,
  });
  return result;
}

/**
 * フレーズの一覧を `createdAt` の降順で返す。
 */
export async function listPhrases() {
  const result = await prisma.phrase.findMany({
    orderBy: {
      createdAt: "desc",
    },
    // ステップ4で where に userId を足し、自分のフレーズだけに絞る
  });
  return result;
}
