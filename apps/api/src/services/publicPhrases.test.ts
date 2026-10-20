import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../lib/error.js";
import { prisma } from "../lib/prisma.js";
import { getPublicPhrase, listPublicPhrases } from "./publicPhrases.js";

// Prisma をモックしたテストでは、where が実際に絞り込めるかまでは確かめられない
// （services/phrases.test.ts と同じ）。ここでは次の3つを確かめる。
// ・where に isPublic: true を入れていること（非公開が混ざらない）
// ・select に note と userId が入っていないこと（公開してはいけない項目が漏れない）
// ・null → 404 の分岐
// 実際に絞り込めるかは、DB を使うテスト（ステップ8）か curl で確かめる。

afterEach(() => {
  vi.restoreAllMocks();
});

const row = { id: 1, phrase: "hello", meaning: "こんにちは" };

// 呼び出しに渡された select から、true になっている項目名を取り出す
const selectedKeys = (select: unknown) =>
  Object.entries(select as Record<string, boolean>)
    .filter(([, v]) => v)
    .map(([k]) => k);

describe("listPublicPhrases", () => {
  it("where で公開フレーズだけに絞り、createdAt の降順で取る", async () => {
    const findMany = vi.spyOn(prisma.phrase, "findMany").mockResolvedValue([]);

    await listPublicPhrases();

    expect(findMany).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("select に note と userId を含めない", async () => {
    const findMany = vi.spyOn(prisma.phrase, "findMany").mockResolvedValue([]);

    await listPublicPhrases();

    const keys = selectedKeys(findMany.mock.calls[0]![0]!.select);
    expect(keys).not.toContain("note");
    expect(keys).not.toContain("userId");
    // select が空だと全項目が返らず、何も取れなくなるので、取る項目があることも見ておく
    expect(keys).toContain("id");
    expect(keys).toContain("phrase");
  });

  it("DB の結果をそのまま返す", async () => {
    vi.spyOn(prisma.phrase, "findMany").mockResolvedValue([row] as never);

    expect(await listPublicPhrases()).toEqual([row]);
  });
});

describe("getPublicPhrase", () => {
  it("where に id と isPublic: true を入れる", async () => {
    const findUnique = vi
      .spyOn(prisma.phrase, "findUnique")
      .mockResolvedValue(row as never);

    await getPublicPhrase(1);

    expect(findUnique).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ where: { id: 1, isPublic: true } }),
    );
  });

  it("select に note と userId を含めない", async () => {
    const findUnique = vi
      .spyOn(prisma.phrase, "findUnique")
      .mockResolvedValue(row as never);

    await getPublicPhrase(1);

    const keys = selectedKeys(findUnique.mock.calls[0]![0].select);
    expect(keys).not.toContain("note");
    expect(keys).not.toContain("userId");
    expect(keys).toContain("id");
    expect(keys).toContain("phrase");
  });

  it("見つかればそのまま返す", async () => {
    vi.spyOn(prisma.phrase, "findUnique").mockResolvedValue(row as never);

    expect(await getPublicPhrase(1)).toEqual(row);
  });

  it("null（存在しない・非公開）→ AppError(404) を投げる", async () => {
    vi.spyOn(prisma.phrase, "findUnique").mockResolvedValue(null);

    await expect(getPublicPhrase(1)).rejects.toBeInstanceOf(AppError);
    await expect(getPublicPhrase(1)).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
  });
});
