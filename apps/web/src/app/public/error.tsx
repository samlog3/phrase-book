// error.tsx は、読み込み先が Client Component でも、このファイル自体に "use client" がないとビルドで落ちる
"use client";

/**
 * /public 以下で想定外のエラー（api が落ちているなど）が起きたときの画面。
 * 文言も「再読み込み」の動きも /phrases と同じでよいので、/phrases の error.tsx をそのまま使う。
 */
export { default } from "@/app/phrases/error";
