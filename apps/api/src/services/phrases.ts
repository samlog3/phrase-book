import {
  ERROR_CODE,
  type CreatePhraseInput,
  type UpdatePhraseInput,
} from "@phrase-book/shared";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/error.js";
import { Prisma } from "../generated/prisma/client.js";

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

/**
 * 指定した ID のフレーズを返す。
 *
 * @param id フレーズの ID
 * @throws {AppError} フレーズが存在しないとき（404 `NOT_FOUND`）
 */
export async function getPhrase(id: number) {
  const result = await prisma.phrase.findUnique({
    where: {
      id,
    },
  });
  if (result === null) {
    throw new AppError(404, ERROR_CODE.NOT_FOUND, "Not found");
  }
  return result;
}

/**
 * 指定した ID のフレーズを更新し、更新後のフレーズを返す。
 * `input` が `{}` のときは `update` を呼ばず、現在のフレーズをそのまま返す（`updatedAt` を変えないため）。
 *
 * @param id フレーズの ID
 * @param input `updatePhraseSchema` で検証・変換した後の値（キーがない項目は変更しない、`null` は空にする）
 * @throws {AppError} フレーズが存在しないとき（404 `NOT_FOUND`）
 */
export async function updatePhrase(id: number, input: UpdatePhraseInput) {
  if (Object.keys(input).length === 0) {
    return getPhrase(id);
  }
  try {
    const result = await prisma.phrase.update({
      where: {
        id,
      },
      data: input,
    });
    return result;
  } catch (e) {
    if (isRecordNotFoundError(e)) {
      throw new AppError(404, ERROR_CODE.NOT_FOUND, "Not found");
    }
    throw e;
  }
}

/**
 * 指定した ID のフレーズを削除し、削除したフレーズを返す。
 *
 * @param id フレーズの ID
 * @throws {AppError} フレーズが存在しないとき（404 `NOT_FOUND`）
 */
export async function deletePhrase(id: number) {
  try {
    const result = await prisma.phrase.delete({
      where: {
        id,
      },
    });
    return result;
  } catch (e) {
    if (isRecordNotFoundError(e)) {
      throw new AppError(404, ERROR_CODE.NOT_FOUND, "Not found");
    }
    throw e;
  }
}

/**
 * Prisma の P2025 かどうかを判定する。
 * P2025 は `update` / `delete` の対象のレコードが見つからなかったときに Prisma が投げるエラー。
 *
 * @param e catch で受け取ったエラー
 */
function isRecordNotFoundError(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025"
  );
}
