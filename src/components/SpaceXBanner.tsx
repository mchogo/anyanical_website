// JST 2026-06-12 00:00:00
const CUTOFF_MS = new Date('2026-06-12T00:00:00+09:00').getTime();

const TICKER_ITEMS = [
  '🚀 SpaceX × Hyperliquid — IPO前後の値動きを先取り',
  '⏰ 6月12日 (金) IPO予定 · 期間限定マーケット開設中',
  '🌐 SpaceX perp — ロング / ショート どちらも取引可能',
  '📊 Hyperliquidでパーミッションレス参加 · 誰でも今すぐ',
  '🚀 SpaceX IPO · 週末も値動きする可能性あり · 要注意',
  '⏰ 6/12まで · チャンスを逃さないで',
];

const formatCountdown = (ms: number): string => {
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${d}日 ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// 表示可否の判定は src/hooks/useAnnouncementBanners.ts の useSpaceXBannerState
// (AnnouncementBar.tsxが他の告知バナーとの優先順位付けに使う)。
export const SpaceXBanner = ({ now, dismiss }: { now: number; dismiss: () => void }) => {
  const remaining = CUTOFF_MS - now;

  return (
    // Outer <a> makes the whole banner tappable; dismiss button stops propagation
    <a
      href="#/spacex"
      className="block border-b border-amber-400/20 bg-gradient-to-r from-slate-950 via-amber-950/25 to-slate-950"
      aria-label="SpaceX IPO 特設ページを見る"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 sm:px-6 lg:px-8">
        <span className="shrink-0 rounded bg-amber-400 px-2 py-0.5 text-xs font-black tracking-wide text-slate-950">
          NEW
        </span>

        <span className="hidden shrink-0 text-sm font-bold text-amber-200 sm:block">
          🚀 SpaceX × HL
        </span>

        <span className="hidden h-3 w-px shrink-0 bg-white/15 sm:block" />

        <div className="min-w-0 flex-1 overflow-hidden motion-reduce:overflow-auto">
          <div className="animate-marquee motion-reduce:animate-none inline-flex gap-16 whitespace-nowrap">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="text-xs text-slate-400 sm:text-sm">
                {item}
              </span>
            ))}
          </div>
        </div>

        <span className="hidden shrink-0 font-mono text-xs tabular-nums text-amber-300/70 lg:block">
          残り {formatCountdown(remaining)}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dismiss();
          }}
          className="ml-1 shrink-0 rounded-full p-1 text-slate-600 transition hover:bg-white/10 hover:text-slate-400"
          aria-label="バナーを閉じる"
        >
          ✕
        </button>
      </div>
    </a>
  );
};
