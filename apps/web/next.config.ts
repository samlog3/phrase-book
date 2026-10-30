import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Docker 用に、実行に必要なファイルだけを .next/standalone に集める
  output: "standalone",
  // モノレポなので、apps/web の外（packages/shared やルートの node_modules）も追跡の対象にする
  outputFileTracingRoot: path.join(__dirname, "../../"),
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
