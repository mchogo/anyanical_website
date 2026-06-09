import { useEffect, useMemo, useState } from 'react';

import { IPO_MARKETS } from '../config/markets';
import type { MarketPrice } from '../config/markets';
import type {
  Alert,
  AlertCondition,
  NotificationPermissionStatus,
} from '../hooks/useAlerts';
import type { PriceHistoryPoint } from '../hooks/useHyperliquidMids';
import { MarketCard } from './MarketCard';

// June 12, 2026 9:30 AM EDT (NYSE open) = 13:30 UTC
const IPO_MS = new Date('2026-06-12T13:30:00Z').getTime();
// S-1 filing date (May 20)
const S1_MS = new Date('2026-05-20T00:00:00Z').getTime();

type SpaceXCountdownPageProps = {
  prices: Record<string, MarketPrice>;
  priceHistory: Record<string, PriceHistoryPoint[]>;
  now: number;
  isWeekendMode: boolean;
  alerts: Alert[];
  addAlert: (symbol: string, condition: AlertCondition, threshold: number) => void;
  removeAlert: (alertId: string) => void;
  requestPermission: () => Promise<void>;
  permissionStatus: NotificationPermissionStatus;
};

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

const getCountdown = (now: number) => {
  const diff = Math.max(0, IPO_MS - now);
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1_000),
    done: diff === 0,
  };
};

const getProgress = (now: number) => {
  const total = IPO_MS - S1_MS;
  const elapsed = now - S1_MS;
  return Math.max(0, Math.min(100, (elapsed / total) * 100));
};

// Static stars — generated once on module load for stability
const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: ((i * 137.508) % 100),
  y: ((i * 97.332) % 100),
  r: (i % 3) * 0.5 + 0.5,
  o: (i % 5) * 0.08 + 0.08,
}));

const CountdownBlock = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="relative">
      <span className="font-mono text-6xl font-black tabular-nums text-white sm:text-7xl md:text-8xl lg:text-9xl">
        {pad(value)}
      </span>
    </div>
    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
      {label}
    </span>
  </div>
);

const Separator = () => (
  <span className="mb-7 self-center font-mono text-4xl font-thin text-amber-400/40 sm:text-5xl md:text-6xl lg:text-7xl">
    :
  </span>
);

const spcxMarket = IPO_MARKETS.find((m) => m.symbol === 'SPCX');

export const SpaceXCountdownPage = ({
  prices,
  priceHistory,
  now,
  isWeekendMode,
  alerts,
  addAlert,
  removeAlert,
  requestPermission,
  permissionStatus,
}: SpaceXCountdownPageProps) => {
  const [localNow, setLocalNow] = useState(() => now);

  useEffect(() => {
    const id = window.setInterval(() => setLocalNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  const { d, h, m, s, done } = useMemo(() => getCountdown(localNow), [localNow]);
  const progress = useMemo(() => getProgress(localNow), [localNow]);

  const tweetText = encodeURIComponent(
    `🚀 SpaceX IPO まであと${d}日！\n6月12日 9:30 AM ET (NYSE) に上場予定\n\n#SpaceX #SPCX #Hyperliquid`,
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Space background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(251,146,60,0.12), transparent),' +
            'radial-gradient(ellipse 60% 40% at 50% 110%, rgba(34,211,238,0.05), transparent)',
        }}
      />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {STARS.map((star) => (
          <circle
            key={star.id}
            cx={`${star.x}%`}
            cy={`${star.y}%`}
            r={star.r}
            fill="white"
            opacity={star.o}
          />
        ))}
      </svg>

      {/* Back link */}
      <div className="relative mx-auto max-w-4xl px-4 pt-10 sm:px-6 lg:px-8">
        <a
          href="#/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-300"
        >
          ← ホームへ戻る
        </a>
      </div>

      {/* Main content */}
      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
        {/* Icon + Title */}
        <div className="text-6xl">🚀</div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
          SpaceX IPO Countdown
        </h1>
        <p className="mt-3 text-sm text-slate-400 sm:text-base">
          June 12, 2026 · 9:30 AM ET · NYSE:{' '}
          <span className="font-bold text-amber-300">SPCX</span>
        </p>

        {/* Countdown */}
        <div className="mt-12 flex items-start gap-3 sm:gap-5 md:gap-7">
          <CountdownBlock value={d} label="Days" />
          <Separator />
          <CountdownBlock value={h} label="Hours" />
          <Separator />
          <CountdownBlock value={m} label="Minutes" />
          <Separator />
          <CountdownBlock value={s} label="Seconds" />
        </div>

        {done && (
          <p className="mt-6 text-lg font-bold text-amber-300">
            🎉 上場しました！
          </p>
        )}

        {/* Progress bar */}
        <div className="mt-14 w-full max-w-lg">
          <div className="mb-2 flex justify-between text-xs text-slate-500">
            <span>S-1 提出</span>
            <span className="font-semibold text-amber-400/80">
              {progress.toFixed(1)}% to launch
            </span>
            <span>上場</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-[width] duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-slate-600">
            <span>May 20</span>
            <span>Jun 12</span>
          </div>
        </div>

        {/* Milestones */}
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-amber-400/10 px-3 py-1 text-amber-300 ring-1 ring-amber-400/20">
            ✓ S-1 Filed · May 20
          </span>
          <span className="text-slate-700">→</span>
          <span className="rounded-full bg-white/[0.04] px-3 py-1 ring-1 ring-white/10">
            Listing · Jun 12
          </span>
        </div>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a
            href="https://app.hyperliquid.xyz/trade/SPCX"
            rel="noopener noreferrer nofollow"
            target="_blank"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-amber-400 px-6 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
          >
            📈 参考チャートを見る
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${tweetText}`}
            rel="noopener noreferrer"
            target="_blank"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/[0.06] px-6 text-sm font-semibold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
          >
            𝕏 シェア
          </a>
          <a
            href="#/board"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/[0.06] px-6 text-sm font-semibold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
          >
            📊 相場ボードを見る
          </a>
        </div>
      </div>

      {/* SPCX MarketCard */}
      {spcxMarket && (
        <div className="relative mx-auto max-w-sm px-4 pb-12 sm:px-6 lg:px-8">
          <p className="mb-4 text-center text-sm font-semibold text-amber-300/70">
            SPCX 参考価格（Hyperliquid）
          </p>
          <MarketCard
            market={spcxMarket}
            price={prices['SPCX']}
            now={localNow}
            isWeekendMode={isWeekendMode}
            priceHistory={priceHistory['SPCX'] ?? []}
            alerts={alerts}
            addAlert={addAlert}
            removeAlert={removeAlert}
            requestPermission={requestPermission}
            permissionStatus={permissionStatus}
            index={0}
          />
        </div>
      )}

      {/* Disclaimer */}
      <p className="relative mx-auto max-w-md pb-16 text-center text-xs leading-6 text-slate-700">
        非公式ファンページです。上場日時・ティッカーは報道ベースであり、変更される可能性があります。
        投資判断はご自身の責任で行ってください。
      </p>
    </div>
  );
};
