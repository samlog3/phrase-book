import { afterEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../lib/error.js";
import { prisma } from "../lib/prisma.js";
import {
  createPhrase,
  deletePhrase,
  getPhrase,
  listPhrases,
  updatePhrase,
} from "./phrases.js";

// Prisma をモックしたテストでは「並び順や where が正しいか」までは確かめられない
// （書いた引数で呼んだことしか分からない）。そのため、ここでは service が自分で持っている
// 分岐（null → 404、P2025 → 404、{} のとき update しない）だけを確かめる。

// vi.spyOn で差し替えたものをテストごとに元に戻す
afterEach(() => {
  vi.restoreAllMocks();
});

// Prisma が返すフレーズの代わり。型を全部書くのは大変なので、使う場所で as never にする
const row = { id: 1, phrase: "hello", meaning: "こんにちは" };

const userId = "user-1";

// service と同じ Prisma を使う（違う実体だと instanceof が false になる）
const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("prisma error", {
    code,
    clientVersion: "test",
  });

describe("getPhrase", () => {
  it("null → AppError(404) を投げる", async () => {
    vi.spyOn(prisma.phrase, "findUnique").mockResolvedValue(null);

    await expect(getPhrase(1, userId)).rejects.toBeInstanceOf(AppError);
    await expect(getPhrase(1, userId)).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
  });
});

describe("deletePhrase", () => {
  it("P2025 → AppError(404) に変わる", async () => {
    vi.spyOn(prisma.phrase, "delete").mockRejectedValue(prismaError("P2025"));

    // await を忘れると、判定されないままテストが終わって常に成功してしまう
    await expect(deletePhrase(1, userId)).rejects.toBeInstanceOf(AppError);
    await expect(deletePhrase(1, userId)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("P2025 以外 → 404 に変わらず、そのまま投げ直される", async () => {
    const p2002 = prismaError("P2002");
    vi.spyOn(prisma.phrase, "delete").mockRejectedValue(p2002);

    // toBe は「同じインスタンス」を見る。包み直されていたら落ちる
    await expect(deletePhrase(1, userId)).rejects.toBe(p2002);
  });
});

describe("updatePhrase", () => {
  it("P2025 → AppError(404) に変わる", async () => {
    vi.spyOn(prisma.phrase, "update").mockRejectedValue(prismaError("P2025"));

    // input が {} だと update を呼ばない分岐に入るので、中身のある値を渡す
    await expect(
      updatePhrase(1, { phrase: "x" }, userId),
    ).rejects.toBeInstanceOf(AppError);
    await expect(
      updatePhrase(1, { phrase: "x" }, userId),
    ).rejects.toMatchObject({
      status: 404,
    });
  });

  it("P2025 以外 → 404 に変わらず、そのまま投げ直される", async () => {
    const p2002 = prismaError("P2002");
    vi.spyOn(prisma.phrase, "update").mockRejectedValue(p2002);

    await expect(updatePhrase(1, { phrase: "x" }, userId)).rejects.toBe(p2002);
  });

  it("{} のとき、update を呼ばず現在のフレーズを返す", async () => {
    const update = vi.spyOn(prisma.phrase, "update");
    vi.spyOn(prisma.phrase, "findUnique").mockResolvedValue(row as never);

    const result = await updatePhrase(1, {}, userId);

    // update を呼ぶと updatedAt が変わってしまう
    expect(update).not.toHaveBeenCalled();
    expect(result).toEqual(row);
  });
});

// where や data に userId が入っていることを確かめる。
// 入れ忘れると他人のフレーズに触れてしまうので、モックでも最低限ここは見ておく。
describe("userId の渡し方", () => {
  it("createPhrase: data に userId を入れて保存する", async () => {
    const create = vi
      .spyOn(prisma.phrase, "create")
      .mockResolvedValue(row as never);
    const input = { phrase: "hello", meaning: "こんにちは" } as never;

    await createPhrase(input, userId);

    expect(create).toHaveBeenCalledExactlyOnceWith({
      data: { phrase: "hello", meaning: "こんにちは", userId },
    });
  });

  it("listPhrases: where で自分のフレーズだけに絞る", async () => {
    const findMany = vi.spyOn(prisma.phrase, "findMany").mockResolvedValue([]);

    await listPhrases(userId);

    expect(findMany).toHaveBeenCalledExactlyOnceWith({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  });

  it("getPhrase: where に id と userId を入れる", async () => {
    const findUnique = vi
      .spyOn(prisma.phrase, "findUnique")
      .mockResolvedValue(row as never);

    await getPhrase(1, userId);

    expect(findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { id: 1, userId },
    });
  });

  it("updatePhrase: where に id と userId を入れる", async () => {
    const update = vi
      .spyOn(prisma.phrase, "update")
      .mockResolvedValue(row as never);

    await updatePhrase(1, { phrase: "x" }, userId);

    expect(update).toHaveBeenCalledExactlyOnceWith({
      where: { id: 1, userId },
      data: { phrase: "x" },
    });
  });

  it("updatePhrase: {} のときも userId を付けて取得する", async () => {
    const findUnique = vi
      .spyOn(prisma.phrase, "findUnique")
      .mockResolvedValue(row as never);

    await updatePhrase(1, {}, userId);

    expect(findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { id: 1, userId },
    });
  });

  it("deletePhrase: where に id と userId を入れる", async () => {
    const del = vi
      .spyOn(prisma.phrase, "delete")
      .mockResolvedValue(row as never);

    await deletePhrase(1, userId);

    expect(del).toHaveBeenCalledExactlyOnceWith({ where: { id: 1, userId } });
  });
});
