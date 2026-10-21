import { Suspense } from "react";
import { SignupView } from "@/components/signup-view";
import { getSafeRedirect } from "@/lib/redirect";

type SignupPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * サインアップ画面。`?redirect=` を検証して登録後の遷移先を決め、`SignupView` に渡す。
 * 安全でない値（外部 URL など）は `getSafeRedirect` により "/" になる。
 * ログインへのリンクにも遷移先を引き継ぐ。
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
  const { redirect } = await searchParams;
  const redirectTo = getSafeRedirect(redirect);
  const loginHref =
    redirectTo === "/"
      ? "/login"
      : `/login?redirect=${encodeURIComponent(redirectTo)}`;

  return <SignupView redirectTo={redirectTo} loginHref={loginHref} />;
}
