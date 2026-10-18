import { afterEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../lib/error.js";
import { prisma } from "../lib/prisma.js";
import { deletePhrase, getPhrase, updatePhrase } from "./phrases.js";

// Prisma をモックしたテストでは「並び順や where が正しいか」までは確かめられない
// （書いた引数で呼んだことしか分からない）。そのため、ここでは service が自分で持っている
// 分岐（null → 404、P2025 → 404、{} のとき update しない）だけを確かめる。

// vi.spyOn で差し替えたものをテストごとに元に戻す
afterEach(() => {
  vi.restoreAllMocks();
});

// Prisma が返すフレーズの代わり。型を全部書くのは大変なので、使う場所で as never にする
const row = { id: 1, phrase: "hello", meaning: "こんにちは" };

// service と同じ Prisma を使う（違う実体だと instanceof が false になる）
const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("prisma error", {
    code,
    clientVersion: "test",
  });

describe("getPhrase", () => {
  it("null → AppError(404) を投げる", async () => {
    vi.spyOn(prisma.phrase, "findUnique").mockResolvedValue(null);

    await expect(getPhrase(1)).rejects.toBeInstanceOf(AppError);
    await expect(getPhrase(1)).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
  });
});

describe("deletePhrase", () => {
  it("P2025 → AppError(404) に変わる", async () => {
    vi.spyOn(prisma.phrase, "delete").mockRejectedValue(prismaError("P2025"));

    // await を忘れると、判定されないままテストが終わって常に成功してしまう
    await expect(deletePhrase(1)).rejects.toBeInstanceOf(AppError);
    await expect(deletePhrase(1)).rejects.toMatchObject({ status: 404 });
  });

  it("P2025 以外 → 404 に変わらず、そのまま投げ直される", async () => {
    const p2002 = prismaError("P2002");
    vi.spyOn(prisma.phrase, "delete").mockRejectedValue(p2002);

    // toBe は「同じインスタンス」を見る。包み直されていたら落ちる
    await expect(deletePhrase(1)).rejects.toBe(p2002);
  });
});

describe("updatePhrase", () => {
  it("P2025 → AppError(404) に変わる", async () => {
    vi.spyOn(prisma.phrase, "update").mockRejectedValue(prismaError("P2025"));

    // input が {} だと update を呼ばない分岐に入るので、中身のある値を渡す
    await expect(updatePhrase(1, { phrase: "x" })).rejects.toBeInstanceOf(
      AppError,
    );
    await expect(updatePhrase(1, { phrase: "x" })).rejects.toMatchObject({
      status: 404,
    });
  });

  it("P2025 以外 → 404 に変わらず、そのまま投げ直される", async () => {
    const p2002 = prismaError("P2002");
    vi.spyOn(prisma.phrase, "update").mockRejectedValue(p2002);

    await expect(updatePhrase(1, { phrase: "x" })).rejects.toBe(p2002);
  });

  it("{} のとき、update を呼ばず現在のフレーズを返す", async () => {
    const update = vi.spyOn(prisma.phrase, "update");
    vi.spyOn(prisma.phrase, "findUnique").mockResolvedValue(row as never);

    const result = await updatePhrase(1, {});

    // update を呼ぶと updatedAt が変わってしまう
    expect(update).not.toHaveBeenCalled();
    expect(result).toEqual(row);
  });
});
