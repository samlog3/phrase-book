import { Hono } from "hono";
import phrases from "./routes/phrases.js";
import { AppError, errorResponse } from "./lib/error.js";
import { ERROR_CODE } from "@phrase-book/shared";
import { HTTPException } from "hono/http-exception";

const app = new Hono().route("/api/phrases", phrases).get("/", (c) => {
  return c.text("Hello Hono!");
});

app.notFound((c) => {
  return c.json(errorResponse(ERROR_CODE.NOT_FOUND, "Not found"), 404);
});

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(
      errorResponse(err.code, err.message, err.details),
      err.status,
    );
  }
  if (err instanceof HTTPException && err.status === 400) {
    // VALIDATION_ERROR (400)
    return c.json(
      errorResponse(ERROR_CODE.VALIDATION_ERROR, "Invalid request", {
        formErrors: ["Malformed JSON in request body"],
        fieldErrors: {},
      }),
      400,
    );
  } else {
    console.error(err);
    return c.json(
      errorResponse(ERROR_CODE.INTERNAL_ERROR, "Internal server error"),
      500,
    );
  }
});

export default app;
export type AppType = typeof app;
