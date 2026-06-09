import { useEffect, useState } from 'react';

// JST 2026-06-12 00:00:00
const CUTOFF_MS = new Date('2026-06-12T00:00:00+09:00').getTime();

const TICKER_ITEMS = [
  '🚀 SpaceX × Hyperliquid — IPO前後の値動きを先取り',
  '⏰ 6月12日 (金) IPO予定 · 期間限定マーケット開設中',
  '✨ NEW: 銘柄ピン留め機能 — よく見る銘柄を★でお気に入り登録',
  '✨ NEW: 価格クリックでクリップボードにコピー',
  '✨ NEW: アラートが6秒で自動消去 · プログレスバー付き',
  '🌐 SpaceX perp — ロング / ショート どちらも取引可能',
  '✨ NEW: EAチェックリストの状態を保存 · 次回も継続',
  '📊 SpaceX上場予測 · Hyperliquidでパーミッションレス参加',
  '✨ NEW: GapWatchテーブルを変動率でソート可能に',
  '🚀 SpaceX IPO · 月曜オープン同様に週末も動く可能性あり',
];

const formatCountdown = (ms: number): string => {
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${d}日 ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const SpaceXBanner = () => {
  const [now, setNow] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('spacex-banner-dismissed') === '1',
  );

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  if (dismissed || now >= CUTOFF_MS) return null;

  const remaining = CUTOFF_MS - now;

  return (
    <div className="relative border-b border-amber-400/20 bg-gradient-to-r from-slate-950 via-amber-950/25 to-slate-950">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 sm:px-6 lg:px-8">
        {/* NEW badge */}
        <span className="shrink-0 rounded bg-amber-400 px-2 py-0.5 text-xs font-black tracking-wide text-slate-950">
          NEW
        </span>

        {/* Title — hidden on very small screens */}
        <a
          href="https://app.hyperliquid.xyz/"
          rel="noopener noreferrer nofollow"
          target="_blank"
          className="hidden shrink-0 text-sm font-bold text-amber-200 transition hover:text-amber-100 sm:block"
        >
          🚀 SpaceX × HL
        </a>

        <span className="hidden h-3 w-px shrink-0 bg-white/15 sm:block" />

        {/* Scrolling ticker */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="animate-marquee inline-flex gap-16 whitespace-nowrap">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="text-xs text-slate-400 sm:text-sm">
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Countdown */}
        <span className="hidden shrink-0 font-mono text-xs tabular-nums text-amber-300/70 lg:block">
          残り {formatCountdown(remaining)}
        </span>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem('spacex-banner-dismissed', '1');
            setDismissed(true);
          }}
          className="ml-1 shrink-0 rounded-full p-1 text-slate-600 transition hover:bg-white/10 hover:text-slate-400"
          aria-label="バナーを閉じる"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
