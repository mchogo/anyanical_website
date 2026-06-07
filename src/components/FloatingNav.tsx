import { EXTERNAL_LINKS, INTERNAL_NAV_LINKS } from '../config/navigation';

type FloatingNavProps = {
  currentRoute: string;
};

const isActiveRoute = (href: string, currentRoute: string) => {
  const linkRoute = href.replace(/^#\/?/, '');
  return linkRoute === currentRoute || (linkRoute === '' && currentRoute === '');
};

export const FloatingNav = ({ currentRoute }: FloatingNavProps) => (
  <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/92 px-3 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center gap-3">
      <a
        href="#/"
        className="shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-white transition hover:text-cyan-100"
      >
        アニャニカル覗き部屋
      </a>

      <div className="flex items-center gap-2 overflow-x-auto">
        {INTERNAL_NAV_LINKS.map((link) => {
          const isActive = isActiveRoute(link.href, currentRoute);

          return (
            <a
              key={link.href}
              href={link.href}
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
            className="shrink-0 rounded-full bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-300/30 transition hover:bg-emerald-300/20"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  </nav>
);
