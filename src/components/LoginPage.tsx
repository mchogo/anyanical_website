import { useEffect, useRef, useState, useCallback } from 'react';

import type { useDiscordAuth } from '../hooks/useDiscordAuth';

type DiscordAuth = ReturnType<typeof useDiscordAuth>;

type LoginPageProps = {
  auth: DiscordAuth;
  isCallbackRoute: boolean;
};

const NOTE_MEMBERSHIP_URL = 'https://note.com/anyafx/membership';
const MEMBERSHIP_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSc9odFoGLOGFGpCN_OsZewwzXhO61xdzBxY6bQk_NCsQHeq2Q/viewform?usp=dialog';

const NonPremiumGuide = () => (
  <div className="mt-5 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4">
    <p className="text-sm font-bold text-amber-100">
      プレミアムロールがまだ確認できません
    </p>
    <p className="mt-2 text-sm leading-6 text-amber-100/80">
      限定チャンネルを見たい場合は、noteメンバーシップ加入後にロール付与申請を送ってください。
      申請にはnote会員証、note ID、Discord IDが必要です。
    </p>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <a
        href={NOTE_MEMBERSHIP_URL}
        rel="noopener noreferrer"
        target="_blank"
        className="inline-flex min-h-10 items-center justify-center rounded-full bg-amber-200 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
      >
        noteサブスクを見る
      </a>
      <a
        href={MEMBERSHIP_FORM_URL}
        rel="noopener noreferrer"
        target="_blank"
        className="inline-flex min-h-10 items-center justify-center rounded-full bg-white/[0.06] px-4 text-sm font-bold text-amber-100 ring-1 ring-amber-200/30 transition hover:bg-white/10"
      >
        ロール付与フォーム
      </a>
    </div>
  </div>
);

export const LoginPage = ({ auth, isCallbackRoute }: LoginPageProps) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(isCallbackRoute);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasCompletedCallback = useRef(false);

  const handleRefreshRoles = useCallback(async () => {
    setIsRefreshing(true);
    await auth.refreshRoles();
    setIsRefreshing(false);
  }, [auth]);
  const avatarUrl = auth.session ? auth.getAvatarUrl(auth.session.user) : null;
  const roleAccessLabel =
    auth.roleAccess === 'admin'
      ? '管理者'
      : auth.roleAccess === 'premium'
        ? 'プレミアム'
        : auth.roleAccess === 'member'
          ? 'サーバーメンバー'
          : '未参加/未確認';

  useEffect(() => {
    if (!isCallbackRoute || hasCompletedCallback.current) {
      return;
    }

    hasCompletedCallback.current = true;
    let isMounted = true;

    const completeLogin = async () => {
      setIsProcessing(true);
      const result = await auth.completeLoginFromRedirect();

      if (!isMounted) {
        return;
      }

      if (result.status === 'success') {
        const returnHash = result.returnRoute.replace(/^#?/, '#');
        window.history.replaceState(null, '', returnHash);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
        return;
      }

      if (result.status === 'error') {
        setErrorMessage(result.message);
      }

      setIsProcessing(false);
    };

    void completeLogin();

    return () => {
      isMounted = false;
    };
  }, [auth, isCallbackRoute]);

  const handleDiscordLogin = () => {
    setErrorMessage(null);
    auth.signIn('#/home');
  };

  return (
    <main className="animate-fade-in">
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm font-semibold text-cyan-200">Discord Login</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Discordでログイン</h1>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Discordアカウントを使って、このサイトのログイン状態を保存します。
              取得する情報はDiscordのユーザー名とアイコンだけです。
            </p>

            {errorMessage ? (
              <div className="mt-5 rounded-lg border border-rose-300/30 bg-rose-300/10 p-4 text-sm leading-6 text-rose-100">
                {errorMessage}
              </div>
            ) : null}

            {!auth.isConfigured ? (
              <div className="mt-5 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                Discordログインを有効にするには、環境変数
                <code className="mx-1 rounded bg-slate-950/70 px-1.5 py-0.5">
                  VITE_DISCORD_CLIENT_ID
                </code>
                を設定してください。
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {auth.isAuthenticated ? (
                <>
                  <a
                    href="#/home"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 text-sm font-bold text-slate-950 ring-1 ring-cyan-200 transition hover:bg-cyan-200"
                  >
                    ホームへ戻る
                  </a>
                  <a
                    href="#/tools/trade-journal"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/[0.06] px-5 text-sm font-bold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10"
                  >
                    損益カレンダーへ
                  </a>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleDiscordLogin}
                  disabled={!auth.isConfigured || isProcessing}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-indigo-400 px-5 text-sm font-bold text-white ring-1 ring-indigo-300/60 transition hover:bg-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:ring-white/10"
                >
                  {isProcessing ? '認証中...' : 'Discordでログイン'}
                </button>
              )}

              {auth.isAuthenticated ? (
                <button
                  type="button"
                  onClick={auth.signOut}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/[0.04] px-5 text-sm font-bold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  ログアウト
                </button>
              ) : null}
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-slate-950/50 p-6">
            <p className="text-sm font-semibold text-slate-500">ログイン状態</p>
            {auth.session ? (
              <div className="mt-5 space-y-5">
                <div className="flex items-center gap-4">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-16 w-16 rounded-full border border-white/10 bg-slate-900"
                    />
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-indigo-400/20 text-xl font-black text-indigo-100">
                      {auth.getDisplayName(auth.session.user).slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-bold text-white">
                      {auth.getDisplayName(auth.session.user)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Discord ID: {auth.session.user.id}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Discord role access
                      </p>
                      <p className="mt-2 text-xl font-bold text-white">{roleAccessLabel}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {auth.isGuildMember
                          ? `${auth.session.guildMember?.roles.length ?? 0}件のロールを確認しました。`
                          : '対象Discordサーバーのメンバー情報を確認できませんでした。'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleRefreshRoles()}
                      disabled={isRefreshing}
                      className="shrink-0 rounded-full bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-400 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-slate-200 disabled:opacity-50"
                    >
                      {isRefreshing ? '確認中...' : 'ロールを更新'}
                    </button>
                  </div>
                </div>

                {!auth.canAccessPremium ? <NonPremiumGuide /> : null}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-7 text-slate-400">
                まだログインしていません。ログイン後は固定ナビにDiscord名が表示されます。
              </p>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
};
