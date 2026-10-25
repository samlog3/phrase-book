// /phrases 以下の共通の入れ物。幅と余白はここで決める。
// loading.tsx・error.tsx・page.tsx のどれもこの内側に表示されるので、どの状態でも同じ幅になる。
export default function PhrasesLayout({ children }: LayoutProps<"/phrases">) {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-4 sm:max-w-xl lg:max-w-3xl">
      {children}
    </main>
  );
}
