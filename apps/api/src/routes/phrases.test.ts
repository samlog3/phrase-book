import { ERROR_CODE } from "@phrase-book/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../app.js";
import { auth } from "../lib/auth.js";
import { AppError } from "../lib/error.js";
import {
  createPhrase,
  deletePhrase,
  getPhrase,
  listPhrases,
  updatePhrase,
} from "../services/phrases.js";

const userId = "user-1";

// route の責務は「validator が付いているか」「service に何を渡すか」「ステータスと返す形」。
// 文字数の上限や id の範囲などの細かいルールは schema の側
// （packages/shared/src/phrase.test.ts）で確かめるので、ここでは validator ごとに1件だけ書く。

// vi.mock は import より前に巻き上げられる。
// そのため、ファクトリの中では「ファイル上部の変数」を使わず、vi.fn() をここで作る。
// route が import している5つをすべて返す（足りない名前に触れるとエラーになる）。
vi.mock("../services/phrases.js", () => ({
  listPhrases: vi.fn(),
  createPhrase: vi.fn(),
  getPhrase: vi.fn(),
  updatePhrase: vi.fn(),
  deletePhrase: vi.fn(),
}));

// sessionMiddleware 本体は動かしたまま、セッションを返す getSession だけを差し替える。
// こうすると「ログイン済み」「未ログイン（401）」を getSession の戻り値で切り替えられる。
// auth.handler など、ほかのプロパティは route のテストでは使わないので用意しない。
vi.mock("../lib/auth.js", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

// 既定は「ログイン済み」。clearAllMocks は戻り値の設定を消さないので、
// 未ログインのテストで null にしたあとも、次のテストのためにここで毎回設定し直す。
beforeEach(() => {
  vi.mocked(auth.api.getSession).mockResolvedValue({
    user: { id: userId },
  } as never);
});

// vi.fn() の呼び出し履歴をテストごとに消す。
// （restoreAllMocks は vi.spyOn 用。vi.fn() の履歴を消すのは clearAllMocks）
afterEach(() => {
  vi.clearAllMocks();
});

// service が返すフレーズの代わり（route は中身を見ず、そのまま JSON にするだけ）
const row = { id: 1, phrase: "hello", meaning: "こんにちは" };

// JSON ボディ付きのリクエストを送る
const sendJson = (method: string, path: string, body: unknown) =>
  app.request(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// ミドルウェアは phrases router 全体にかかっているので、代表で GET /api/phrases だけ確かめる
describe("未ログイン", () => {
  it("401 UNAUTHORIZED、service は呼ばれない", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await app.request("/api/phrases");

    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("UNAUTHORIZED");
    expect(vi.mocked(listPhrases)).not.toHaveBeenCalled();
  });
});

// ログイン中のユーザーの id が、そのまま service に渡ることを確かめる
describe("ログイン中のユーザー", () => {
  it("別のユーザーでログインしていれば、そのユーザーの id が service に渡る", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-2" },
    } as never);
    vi.mocked(getPhrase).mockResolvedValue(row as never);

    await app.request("/api/phrases/1");

    expect(vi.mocked(getPhrase)).toHaveBeenCalledExactlyOnceWith(1, "user-2");
  });
});

describe("GET /api/phrases", () => {
  it("200、{ items: [...] } の形で返す", async () => {
    vi.mocked(listPhrases).mockResolvedValue([row] as never);

    const res = await app.request("/api/phrases");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [row] });
    expect(vi.mocked(listPhrases)).toHaveBeenCalledExactlyOnceWith(userId);
  });
});

describe("POST /api/phrases", () => {
  it("201。service には schema で変換した後の値が渡る", async () => {
    vi.mocked(createPhrase).mockResolvedValue(row as never);

    const res = await sendJson("POST", "/api/phrases", {
      phrase: "  hello  ",
      meaning: "こんにちは",
      note: "",
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(row);
    expect(vi.mocked(createPhrase)).toHaveBeenCalledExactlyOnceWith(
      {
        phrase: "hello",
        meaning: "こんにちは",
        note: null,
      },
      userId,
    );
  });

  // 作成時にも公開・非公開を決められる。schema から isPublic を外すと落ちる
  it("isPublic を送ると、その値が service に渡る", async () => {
    vi.mocked(createPhrase).mockResolvedValue(row as never);

    const res = await sendJson("POST", "/api/phrases", {
      phrase: "hello",
      meaning: "こんにちは",
      isPublic: true,
    });

    expect(res.status).toBe(201);
    const input = vi.mocked(createPhrase).mock.calls[0]![0];
    expect(input).toHaveProperty("isPublic", true);
  });

  it("body が不正 → 400 VALIDATION_ERROR、service は呼ばれない", async () => {
    const res = await sendJson("POST", "/api/phrases", { meaning: "m" });

    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
    expect(vi.mocked(createPhrase)).not.toHaveBeenCalled();
  });
});

describe("GET /api/phrases/:id", () => {
  it("200。id は数値に変換されて service に渡る", async () => {
    vi.mocked(getPhrase).mockResolvedValue(row as never);

    const res = await app.request("/api/phrases/1");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(row);
    expect(vi.mocked(getPhrase)).toHaveBeenCalledExactlyOnceWith(1, userId);
  });

  it("id が不正 → 400 VALIDATION_ERROR、service は呼ばれない", async () => {
    const res = await app.request("/api/phrases/abc");

    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
    // vi.mocked() は型を「mock 関数」にするだけ。これで .not.toHaveBeenCalled() などが使える
    expect(vi.mocked(getPhrase)).not.toHaveBeenCalled();
  });

  // route は service のエラーを握りつぶさず、そのままエラーハンドラに渡す
  it("service が AppError(404) を投げる → 404 NOT_FOUND", async () => {
    vi.mocked(getPhrase).mockRejectedValue(
      new AppError(404, ERROR_CODE.NOT_FOUND, "Not found"),
    );

    const res = await app.request("/api/phrases/1");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Not found" },
    });
  });
});

describe("PATCH /api/phrases/:id", () => {
  it("200。id は数値、body は検証した値で service に渡る", async () => {
    vi.mocked(updatePhrase).mockResolvedValue(row as never);

    const res = await sendJson("PATCH", "/api/phrases/1", { phrase: "new" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(row);
    expect(vi.mocked(updatePhrase)).toHaveBeenCalledExactlyOnceWith(
      1,
      { phrase: "new" },
      userId,
    );
  });

  // 更新でも公開・非公開を切り替えられる。schema から isPublic を外すと落ちる
  it("isPublic を送ると、その値が service に渡る", async () => {
    vi.mocked(updatePhrase).mockResolvedValue(row as never);

    const res = await sendJson("PATCH", "/api/phrases/1", { isPublic: false });

    expect(res.status).toBe(200);
    expect(vi.mocked(updatePhrase)).toHaveBeenCalledExactlyOnceWith(
      1,
      { isPublic: false },
      userId,
    );
  });

  it("id が不正 → 400 VALIDATION_ERROR、service は呼ばれない", async () => {
    const res = await sendJson("PATCH", "/api/phrases/abc", { phrase: "new" });

    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
    expect(vi.mocked(updatePhrase)).not.toHaveBeenCalled();
  });

  it("body が不正 → 400 VALIDATION_ERROR、service は呼ばれない", async () => {
    const res = await sendJson("PATCH", "/api/phrases/1", { phrase: null });

    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
    expect(vi.mocked(updatePhrase)).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/phrases/:id", () => {
  it("204、ボディは空。id は数値で service に渡る", async () => {
    vi.mocked(deletePhrase).mockResolvedValue(row as never);

    const res = await app.request("/api/phrases/1", { method: "DELETE" });

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(vi.mocked(deletePhrase)).toHaveBeenCalledExactlyOnceWith(1, userId);
  });

  it("id が不正 → 400 VALIDATION_ERROR、service は呼ばれない", async () => {
    const res = await app.request("/api/phrases/abc", { method: "DELETE" });

    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
    expect(vi.mocked(deletePhrase)).not.toHaveBeenCalled();
  });
});
