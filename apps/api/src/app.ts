import { Hono } from "hono";
import phrases from "./routes/phrases.js";

const app = new Hono().route("/api/phrases", phrases).get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
export type AppType = typeof app;
