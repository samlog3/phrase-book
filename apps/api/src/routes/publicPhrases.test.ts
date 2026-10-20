import { ERROR_CODE } from "@phrase-book/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../app.js";
import { auth } from "../lib/auth.js";
import { AppError } from "../lib/error.js";
import {
  getPublicPhrase,
  listPublicPhrases,
} from "../services/publicPhrases.js";

// route の責務は「ログインなしで呼べるか」「validator が付いているか」「service に何を渡すか」「ステータスと返す形」。
// note / userId を返さないことは service の select で守るので、そちらのテスト
// （services/publicPhrases.test.ts）で確かめる。

vi.mock("../services/publicPhrases.js", () => ({
  listPublicPhrases: vi.fn(),
  getPublicPhrase: vi.fn(),
}));

// 公開 API は sessionMiddleware をかけない。getSession が呼ばれないことを確かめるため、差し替えておく。
// 戻り値は設定しない（vi.fn() は undefined を返す）。万一ミドルウェアが動けば、未ログイン扱いで 401 になる。
vi.mock("../lib/auth.js", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

afterEach(() => {
  vi.clearAllMocks();
});

const row = { id: 1, phrase: "hello", meaning: "こんにちは" };

describe("GET /api/public/phrases", () => {
  it("未ログインでも 200、{ items: [...] } の形で返す", async () => {
    vi.mocked(listPublicPhrases).mockResolvedValue([row] as never);

    const res = await app.request("/api/public/phrases");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [row] });
    expect(vi.mocked(listPublicPhrases)).toHaveBeenCalledExactlyOnceWith();
    // sessionMiddleware がかかっていない
    expect(vi.mocked(auth.api.getSession)).not.toHaveBeenCalled();
  });
});

describe("GET /api/public/phrases/:id", () => {
  it("未ログインでも 200。id は数値に変換されて service に渡る", async () => {
    vi.mocked(getPublicPhrase).mockResolvedValue(row as never);

    const res = await app.request("/api/public/phrases/1");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(row);
    expect(vi.mocked(getPublicPhrase)).toHaveBeenCalledExactlyOnceWith(1);
    expect(vi.mocked(auth.api.getSession)).not.toHaveBeenCalled();
  });

  it("id が不正 → 400 VALIDATION_ERROR、service は呼ばれない", async () => {
    const res = await app.request("/api/public/phrases/abc");

    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
    expect(vi.mocked(getPublicPhrase)).not.toHaveBeenCalled();
  });

  // 存在しない ID も非公開も、service が同じ 404 を投げる。route はそのままエラーハンドラに渡す
  it("service が AppError(404) を投げる → 404 NOT_FOUND", async () => {
    vi.mocked(getPublicPhrase).mockRejectedValue(
      new AppError(404, ERROR_CODE.NOT_FOUND, "Not found"),
    );

    const res = await app.request("/api/public/phrases/1");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Not found" },
    });
  });
});
