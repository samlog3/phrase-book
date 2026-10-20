import { ERROR_CODE } from "@phrase-book/shared";
import type { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../lib/error.js";
import { prisma } from "../lib/prisma.js";

/**
 * 公開用のレスポンスに含める項目。
 * 公開してはいけない `userId` と `note` は含めない（足さないこと）。
 * 取得後に落とすのではなく、ここで最初から取らないことで、カラムが増えても漏れないようにする。
 */
const publicPhraseSelect = {
  id: true,
  phrase: true,
  meaning: true,
  example: true,
  context: true,
  source: true,
  sourceUrl: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PhraseSelect;

/**
 * 公開されているフレーズの一覧を `createdAt` の降順で返す。
 * `publicPhraseSelect` で絞るので、`note` と `userId` は含まれない。
 */
export async function listPublicPhrases() {
  const result = await prisma.phrase.findMany({
    orderBy: {
      createdAt: "desc",
    },
    where: { isPublic: true },
    select: publicPhraseSelect,
  });
  return result;
}

/**
 * 指定した ID の公開フレーズを返す。
 * `publicPhraseSelect` で絞るので、`note` と `userId` は含まれない。
 *
 * @param id フレーズの ID
 * @throws {AppError} フレーズが存在しない、または公開されていないとき（404 `NOT_FOUND`）
 */
export async function getPublicPhrase(id: number) {
  const result = await prisma.phrase.findUnique({
    where: { id, isPublic: true },
    select: publicPhraseSelect,
  });
  if (result === null) {
    throw new AppError(404, ERROR_CODE.NOT_FOUND, "Not found");
  }
  return result;
}
