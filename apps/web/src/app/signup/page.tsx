import { Suspense } from "react";
import { SignupView } from "@/components/signup-view";
import { AFTER_LOGIN_PATH, getSafeRedirect } from "@/lib/redirect";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

type SignupPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * サインアップ画面。`?redirect=` を検証して登録後の遷移先を決め、`SignupView` に渡す。
 * 安全でない値（外部 URL など）や未指定は `getSafeRedirect` により AFTER_LOGIN_PATH になる。
 * ログインへのリンクにも遷移先を引き継ぐ（既定の遷移先のときは付けない）。
 * ログイン済みの場合は、画面を出さずに検証済みの遷移先へ移す。
 */
export default function Page({ searchParams }: SignupPageProps) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={null}>
          <SignupContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * `searchParams` は実行時にしか分からないため、`await` はこのコンポーネントに閉じ込め、
 * `Page` 側の `<Suspense>` で包む。外側のレイアウトは静的な殻として先に描画される。
 */
async function SignupContent({ searchParams }: SignupPageProps) {
  const { redirect: redirectParam } = await searchParams;
  const redirectTo = getSafeRedirect(redirectParam, AFTER_LOGIN_PATH);

  // ログイン済みなら画面を出さずに移す。
  // 未ログインのときはそのまま画面を出したいので、requireSession ではなく getSession を使う。
  // Cookie があっても api が無効と判断すれば null になるため、偽の Cookie でもループしない。
  const session = await getSession();
  if (session) redirect(redirectTo);

  // ここから下は未ログインの人に画面を出すための準備
  const loginHref =
    redirectTo === AFTER_LOGIN_PATH
      ? "/login"
      : `/login?redirect=${encodeURIComponent(redirectTo)}`;

  return <SignupView redirectTo={redirectTo} loginHref={loginHref} />;
}
