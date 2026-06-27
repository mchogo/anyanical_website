import { useEffect, useState } from 'react';

import { EXTERNAL_LINKS, NAV_LINK_GROUPS } from '../config/navigation';
import type { useDiscordAuth } from '../hooks/useDiscordAuth';

type FloatingNavProps = {
  currentRoute: string;
};

type DiscordAuth = ReturnType<typeof useDiscordAuth>;

type FloatingNavContainerProps = FloatingNavProps & {
  auth: DiscordAuth;
};

type NavLink = {
  label: string;
  href: string;
};

const isActiveRoute = (href: string, currentRoute: string) => {
  const linkRoute = href.replace(/^#\/?/, '');
  return linkRoute === currentRoute || (linkRoute === '' && currentRoute === '');
};

const isActiveGroup = (
  group: { href: string; links: readonly NavLink[] },
  currentRoute: string,
) => {
  const groupRoute = group.href.replace(/^#\/?/, '');
  return groupRoute === currentRoute || group.links.some((link) => isActiveRoute(link.href, currentRoute));
};

const DesktopNavLinks = ({
  currentRoute,
  onNavigate,
}: FloatingNavProps & { onNavigate?: () => void }) => (
  <>
    {NAV_LINK_GROUPS.map((group) => {
      const isGroupActive = isActiveGroup(group, currentRoute);

      return (
        <div key={group.label} className="group relative">
          <a
            href={group.href}
            onClick={onNavigate}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ring-1 transition ${
              isGroupActive
                ? 'bg-cyan-300 text-slate-950 ring-cyan-200'
                : 'bg-white/[0.04] text-slate-200 ring-white/10 hover:bg-cyan-300/10 hover:text-cyan-100 hover:ring-cyan-300/30'
            }`}
          >
            {group.label}
            <span
              className={`grid h-5 w-5 place-items-center rounded-full text-xs font-black ring-1 transition group-hover:rotate-180 group-focus-within:rotate-180 ${
                isGroupActive
                  ? 'bg-slate-950/10 text-slate-900 ring-slate-950/15'
                  : 'bg-white/[0.06] text-cyan-100 ring-white/10'
              }`}
            >
              ▼
            </span>
          </a>

          <div className="invisible absolute left-0 top-full z-50 w-52 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
            <div className="rounded-lg border border-white/10 bg-slate-950/95 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur">
              <p className="px-3 py-2 text-xs font-semibold text-slate-500">
                {group.description}
              </p>
              <div className="space-y-1">
                {group.links.map((link) => {
                  const isLinkActive = isActiveRoute(link.href, currentRoute);

                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={onNavigate}
                      className={`block rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        isLinkActive
                          ? 'bg-cyan-300 text-slate-950'
                          : 'text-slate-200 hover:bg-white/[0.06] hover:text-cyan-100'
                      }`}
                    >
                      {link.label}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    })}

    {EXTERNAL_LINKS.map((link) => (
      <a
        key={link.href}
        href={link.href}
        rel="noopener noreferrer"
        target="_blank"
        onClick={onNavigate}
        className="shrink-0 rounded-full bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-300/30 transition hover:bg-emerald-300/20"
      >
        {link.label}
      </a>
    ))}
  </>
);

const MobileNavLinks = ({
  currentRoute,
  onNavigate,
}: FloatingNavProps & { onNavigate?: () => void }) => (
  <>
    {NAV_LINK_GROUPS.map((group) => (
      <details
        key={group.label}
        className="col-span-2 rounded-lg border border-white/10 bg-white/[0.035] p-3"
        open={isActiveGroup(group, currentRoute)}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-white">
          <span>{group.label}</span>
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            {group.description}
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/[0.06] text-cyan-100 ring-1 ring-white/10">
              ▼
            </span>
          </span>
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {group.links.map((link) => {
            const isActive = isActiveRoute(link.href, currentRoute);

            return (
              <a
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                className={`flex min-h-10 items-center justify-center rounded-full px-3 text-sm font-semibold ring-1 transition ${
                  isActive
                    ? 'bg-cyan-300 text-slate-950 ring-cyan-200'
                    : 'bg-white/[0.04] text-slate-200 ring-white/10 hover:bg-cyan-300/10 hover:text-cyan-100'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </div>
        <div className="mt-2 border-t border-white/10 pt-2">
          <a
            href={group.href}
            onClick={onNavigate}
            className="flex min-h-9 items-center justify-center rounded-full px-3 text-xs font-semibold text-slate-400 ring-1 ring-white/[0.06] transition hover:text-slate-200"
          >
            {group.label}の一覧ページへ →
          </a>
        </div>
      </details>
    ))}

    {EXTERNAL_LINKS.map((link) => (
      <a
        key={link.href}
        href={link.href}
        rel="noopener noreferrer"
        target="_blank"
        onClick={onNavigate}
        className="col-span-2 flex min-h-10 items-center justify-center rounded-full bg-emerald-300/10 px-4 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-300/30 transition hover:bg-emerald-300/20"
      >
        {link.label}
      </a>
    ))}
  </>
);

const BANNER_KEYS = ['spacex-banner-dismissed', 'announce-banner-dismissed'];

const hasDismissedBanners = () =>
  BANNER_KEYS.some((key) => sessionStorage.getItem(key) === '1');

const AuthControls = ({
  auth,
  onNavigate,
  mobile = false,
  isOnLoginPage = false,
}: {
  auth: DiscordAuth;
  onNavigate?: () => void;
  mobile?: boolean;
  isOnLoginPage?: boolean;
}) => {
  if (!auth.isAuthenticated || !auth.session) {
    const handleLoginClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isOnLoginPage) {
        e.preventDefault();
        auth.signIn('#/home');
      }
      onNavigate?.();
    };

    return (
      <a
        href="#/login"
        onClick={handleLoginClick}
        className={
          mobile
            ? 'col-span-2 flex min-h-10 items-center justify-center rounded-full bg-indigo-400 px-4 text-sm font-bold text-white ring-1 ring-indigo-300/60 transition hover:bg-indigo-300'
            : 'shrink-0 rounded-full bg-indigo-400 px-4 py-2 text-sm font-bold text-white ring-1 ring-indigo-300/60 transition hover:bg-indigo-300'
        }
      >
        Discordログイン
      </a>
    );
  }

  const avatarUrl = auth.getAvatarUrl(auth.session.user);
  const displayName = auth.getDisplayName(auth.session.user);

  if (mobile) {
    return (
      <div className="col-span-2 rounded-lg border border-white/10 bg-white/[0.035] p-3">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-9 w-9 rounded-full border border-white/10 bg-slate-900"
            />
          ) : (
            <div className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-indigo-400/20 text-sm font-black text-indigo-100">
              {displayName.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{displayName}</p>
            <p className="text-xs text-slate-500">Discordログイン中</p>
          </div>
          <button
            type="button"
            onClick={() => {
              auth.signOut();
              onNavigate?.();
            }}
            className="shrink-0 rounded-full bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
          >
            ログアウト
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <a
        href="#/login"
        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white/[0.04] px-3 text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-indigo-400/10 hover:text-indigo-100 hover:ring-indigo-300/30"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-6 w-6 rounded-full border border-white/10 bg-slate-900"
          />
        ) : (
          <span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-400/20 text-xs font-black text-indigo-100">
            {displayName.slice(0, 1)}
          </span>
        )}
        <span className="max-w-28 truncate">{displayName}</span>
      </a>
      <div className="invisible absolute right-0 top-full z-50 w-44 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="rounded-lg border border-white/10 bg-slate-950/95 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur">
          <button
            type="button"
            onClick={auth.signOut}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] hover:text-indigo-100"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
};

export const FloatingNav = ({ currentRoute, auth }: FloatingNavContainerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [showNotifDot, setShowNotifDot] = useState(() => hasDismissedBanners());

  useEffect(() => {
    const onDismissed = () => setShowNotifDot(true);
    const onReset = () => setShowNotifDot(false);
    window.addEventListener('banner:dismissed', onDismissed);
    window.addEventListener('banner:reset', onReset);
    return () => {
      window.removeEventListener('banner:dismissed', onDismissed);
      window.removeEventListener('banner:reset', onReset);
    };
  }, []);

  const handleResetBanners = () => {
    BANNER_KEYS.forEach((key) => sessionStorage.removeItem(key));
    window.dispatchEvent(new Event('banner:reset'));
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 0);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/95 px-3 py-3 backdrop-blur transition-shadow ${
        hasScrolled
          ? 'shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
          : 'shadow-[0_12px_40px_rgba(0,0,0,0.28)]'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <a
          href="#/home"
          className="shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-white transition hover:text-cyan-100"
          onClick={() => setIsOpen(false)}
        >
          アニャニカル覗き部屋
        </a>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-primary-nav"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-white/[0.04] px-4 text-sm font-semibold text-slate-100 ring-1 ring-white/10 transition hover:bg-cyan-300/10 hover:text-cyan-100 md:hidden"
        >
          {isOpen ? '閉じる' : 'メニュー'}
        </button>

        <div className="hidden items-center gap-2 md:flex">
          <DesktopNavLinks currentRoute={currentRoute} />
          <AuthControls auth={auth} isOnLoginPage={currentRoute === 'login'} />
          <div className="relative ml-1">
            <button
              type="button"
              onClick={handleResetBanners}
              title="お知らせを再表示"
              className="inline-flex min-h-9 items-center justify-center rounded-full bg-white/[0.04] px-3 text-sm text-slate-400 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-slate-200"
            >
              🔔
            </button>
            {showNotifDot && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cyan-400" />
            )}
          </div>
        </div>
      </div>

      {isOpen ? (
        <div
          id="mobile-primary-nav"
          className="animate-slide-down mx-auto mt-3 grid max-h-[calc(100vh-4.5rem)] max-w-7xl grid-cols-2 gap-2 overflow-y-auto border-t border-white/10 pt-3 md:hidden"
        >
          <MobileNavLinks
            currentRoute={currentRoute}
            onNavigate={() => setIsOpen(false)}
          />
          <AuthControls auth={auth} mobile isOnLoginPage={currentRoute === 'login'} onNavigate={() => setIsOpen(false)} />
          <button
            type="button"
            onClick={handleResetBanners}
            className="col-span-2 mt-1 flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 text-sm font-semibold text-slate-400 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-slate-200"
          >
            🔔 お知らせを再表示
            {showNotifDot && <span className="h-2 w-2 rounded-full bg-cyan-400" />}
          </button>
        </div>
      ) : null}
    </nav>
  );
};
