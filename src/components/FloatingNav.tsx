import { useEffect, useState } from 'react';

import { EXTERNAL_LINKS, NAV_LINK_GROUPS } from '../config/navigation';

type FloatingNavProps = {
  currentRoute: string;
};

type NavLink = {
  label: string;
  href: string;
};

const isActiveRoute = (href: string, currentRoute: string) => {
  const linkRoute = href.replace(/^#\/?/, '');
  return linkRoute === currentRoute || (linkRoute === '' && currentRoute === '');
};

const isActiveGroup = (links: readonly NavLink[], currentRoute: string) =>
  links.some((link) => isActiveRoute(link.href, currentRoute));

const marketNavGroup = NAV_LINK_GROUPS[0];
const standardNavLinks: NavLink[] = NAV_LINK_GROUPS.slice(1).flatMap((group) => [
  ...group.links,
]);

const DesktopNavLinks = ({
  currentRoute,
  onNavigate,
}: FloatingNavProps & { onNavigate?: () => void }) => {
  const isMarketActive = isActiveGroup(marketNavGroup.links, currentRoute);

  const handleNavigate = () => {
    onNavigate?.();
  };

  return (
    <>
      <div className="group relative">
        <button
          type="button"
          className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 transition ${
            isMarketActive
              ? 'bg-cyan-300 text-slate-950 ring-cyan-200'
              : 'bg-white/[0.04] text-slate-200 ring-white/10 hover:bg-cyan-300/10 hover:text-cyan-100 hover:ring-cyan-300/30'
          }`}
        >
          {marketNavGroup.label}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${
              isMarketActive
                ? 'bg-slate-950/10 text-slate-800 ring-slate-950/15'
                : 'bg-cyan-300/10 text-cyan-100 ring-cyan-300/20'
            }`}
          >
            メニュー
          </span>
          <span
            className={`grid h-5 w-5 place-items-center rounded-full text-xs font-black ring-1 transition ${
              isMarketActive
                ? 'bg-slate-950/10 text-slate-900 ring-slate-950/15'
                : 'bg-white/[0.06] text-cyan-100 ring-white/10'
            } group-hover:rotate-180 group-focus-within:rotate-180`}
          >
            ▼
          </span>
        </button>

        <div className="invisible absolute right-0 top-full z-50 w-64 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
          <div className="rounded-lg border border-white/10 bg-slate-950/95 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur">
            <p className="px-3 py-2 text-xs font-semibold text-slate-500">
              {marketNavGroup.description}
            </p>
            <div className="space-y-1">
              {marketNavGroup.links.map((link) => {
                const isLinkActive = isActiveRoute(link.href, currentRoute);

                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={handleNavigate}
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

      {standardNavLinks.map((link) => {
        const isActive = isActiveRoute(link.href, currentRoute);

        return (
          <a
            key={link.href}
            href={link.href}
            onClick={handleNavigate}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
              isActive
                ? 'bg-cyan-300 text-slate-950 ring-cyan-200'
                : 'bg-white/[0.04] text-slate-200 ring-white/10 hover:bg-cyan-300/10 hover:text-cyan-100 hover:ring-cyan-300/30'
            }`}
          >
            {link.label}
          </a>
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
};

const MobileNavLinks = ({
  currentRoute,
  onNavigate,
}: FloatingNavProps & { onNavigate?: () => void }) => (
  <>
    <details
      className="col-span-2 rounded-lg border border-white/10 bg-white/[0.035] p-3"
      open={isActiveGroup(marketNavGroup.links, currentRoute)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-white">
        <span className="flex items-center gap-2">
          {marketNavGroup.label}
          <span className="rounded-full bg-cyan-300/10 px-2 py-0.5 text-[10px] font-bold text-cyan-100 ring-1 ring-cyan-300/20">
            開閉
          </span>
        </span>
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          {marketNavGroup.description}
          <span className="grid h-6 w-6 place-items-center rounded-full bg-white/[0.06] text-cyan-100 ring-1 ring-white/10">
            ▼
          </span>
        </span>
      </summary>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {marketNavGroup.links.map((link) => {
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
    </details>

    <div className="col-span-2 grid grid-cols-2 gap-2">
      {standardNavLinks.map((link) => {
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

export const FloatingNav = ({ currentRoute }: FloatingNavProps) => {
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
