import { Suspense } from "react";
import { LoginView } from "@/components/login-view";
import { AFTER_LOGIN_PATH, getSafeRedirect } from "@/lib/redirect";

type LoginPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * ログイン画面。`?redirect=` を検証してログイン後の遷移先を決め、`LoginView` に渡す。
 * 安全でない値（外部 URL など）や未指定は `getSafeRedirect` により AFTER_LOGIN_PATH になる。
 * サインアップへのリンクにも遷移先を引き継ぐ（既定の遷移先のときは付けない）。
 */
export default function Page({ searchParams }: LoginPageProps) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={null}>
          <LoginContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * `searchParams` は実行時にしか分からないため、`await` はこのコンポーネントに閉じ込め、
 * `Page` 側の `<Suspense>` で包む。外側のレイアウトは静的な殻として先に描画される。
 */
async function LoginContent({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;
  const redirectTo = getSafeRedirect(redirect, AFTER_LOGIN_PATH);
  const signupHref =
    redirectTo === AFTER_LOGIN_PATH
      ? "/signup"
      : `/signup?redirect=${encodeURIComponent(redirectTo)}`;

  return <LoginView redirectTo={redirectTo} signupHref={signupHref} />;
}
