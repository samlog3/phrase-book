import { ERROR_CODE } from "@phrase-book/shared";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import * as z from "zod";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "./app.js";
import { AppError } from "./lib/error.js";
import { validator } from "./lib/validator.js";

// 本物のルートがまだないので、テスト用のルートを一時的に足した app を使う。
// （本物の app に app.route() で足すので、app の onError / notFound がそのまま効く）
const testRoutes = new Hono()
  .post(
    "/validate",
    validator("json", z.object({ text: z.string().min(1) })),
    (c) => c.json(c.req.valid("json")),
  )
  .get("/bad-request", () => {
    // bearerAuth などはメッセージなしで 400 を投げる
    throw new HTTPException(400);
  })
  .get("/unauthorized", () => {
    throw new HTTPException(401);
  })
  .get("/payload-too-large", () => {
    throw new HTTPException(413);
  })
  .get("/app-error", () => {
    throw new AppError(404, ERROR_CODE.NOT_FOUND, "Phrase not found");
  })
  .get("/boom", () => {
    throw new Error("secret internal message");
  });

app.route("/__test", testRoutes);

// テストが途中で失敗しても、vi.spyOn で差し替えたものを毎回元に戻す
afterEach(() => {
  vi.restoreAllMocks();
});

describe("エラーレスポンスの統一", () => {
  it("存在しないパス → 404 NOT_FOUND", async () => {
    const res = await app.request("/no-such-path");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Not found" },
    });
  });

  it("バリデーション失敗 → 400 VALIDATION_ERROR、details に fieldErrors が入る", async () => {
    const res = await app.request("/__test/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "" }),
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details.fieldErrors).toHaveProperty("text");
  });

  it("壊れた JSON → 400 VALIDATION_ERROR、details に formErrors が入る", async () => {
    const res = await app.request("/__test/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ broken",
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toEqual({
      formErrors: ["Malformed JSON in request body"],
      fieldErrors: {},
    });
  });

  it("メッセージなしの HTTPException 400 → 400 VALIDATION_ERROR、formErrors は空", async () => {
    const res = await app.request("/__test/bad-request");
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toEqual({ formErrors: [], fieldErrors: {} });
  });

  it("HTTPException 401 → 401 UNAUTHORIZED", async () => {
    const res = await app.request("/__test/unauthorized");

    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("UNAUTHORIZED");
  });

  it("AppError を投げる → 指定した status と code で返る", async () => {
    const res = await app.request("/__test/app-error");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Phrase not found" },
    });
  });

  it("想定外のエラー → 500 INTERNAL_ERROR、エラーの中身は漏れない", async () => {
    // onError の console.error(err) でテスト出力が汚れないようにする
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await app.request("/__test/boom");
    const text = await res.text();

    expect(res.status).toBe(500);
    expect(JSON.parse(text).error.code).toBe("INTERNAL_ERROR");
    expect(text).not.toContain("secret internal message");
    expect(text).not.toContain("stack");
    expect(text).not.toContain(" at ");
    // 中身はレスポンスではなくログに出す
    expect(spy).toHaveBeenCalledOnce();
  });

  it("400・401 以外の HTTPException → 500 INTERNAL_ERROR", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await app.request("/__test/payload-too-large");

    expect(res.status).toBe(500);
    expect((await res.json()).error.code).toBe("INTERNAL_ERROR");
    expect(spy).toHaveBeenCalledOnce();
  });

  it("details を渡さないとき、レスポンスに details のキーがない", async () => {
    const res = await app.request("/__test/app-error");
    const body = await res.json();

    expect(body.error).not.toHaveProperty("details");
  });
});
