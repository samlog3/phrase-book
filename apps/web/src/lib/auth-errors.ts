const FALLBACK_MESSAGE =
  "エラーが発生しました。しばらくしてからもう一度お試しください";

const ALREADY_EXISTS_MESSAGE = "このメールアドレスは既に登録されています";

// 割り切り: Better Auth の全エラーコードは列挙せず、画面で区別したいものだけ載せる。
// 登録済みメールには USER_ALREADY_EXISTS と USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL の
// 2種類があり、バージョンや経路でどちらが返るか分からないため、両方に同じ文言を当てている。
//
// 既知の制約: 登録済みであることを画面に明示しているので、メールアドレスの登録有無を
// 外部から調べられる（アカウント列挙）。学習用のため許容している。
// 本番では emailAndPassword の autoSignIn: false か requireEmailVerification: true で
// 重複時も同じ応答にし、この文言は中立なものに変える。
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "メールアドレスまたはパスワードが正しくありません",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: ALREADY_EXISTS_MESSAGE,
  USER_ALREADY_EXISTS: ALREADY_EXISTS_MESSAGE,
};

export function getAuthErrorMessage(code: string | undefined): string {
  if (code === undefined) return FALLBACK_MESSAGE;
  // MESSAGES[code] だと "constructor" や "toString" でプロトタイプを引いてしまう
  if (!Object.hasOwn(MESSAGES, code)) return FALLBACK_MESSAGE;
  return MESSAGES[code];
}
