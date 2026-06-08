import { ConnectionStatus } from './ConnectionStatus';
import type { ConnectionStatus as ConnectionStatusType } from '../hooks/useHyperliquidMids';

const getMondayOpenCountdown = (now: Date): string | null => {
  const utcDay = now.getUTCDay();
  const nextOpen = new Date(now);

  if (utcDay === 6) {
    nextOpen.setUTCDate(nextOpen.getUTCDate() + 1);
    nextOpen.setUTCHours(22, 0, 0, 0);
  } else if (utcDay === 0 && now.getUTCHours() < 22) {
    nextOpen.setUTCHours(22, 0, 0, 0);
  } else {
    return null;
  }

  const diff = nextOpen.getTime() - now.getTime();
  if (diff <= 0) return null;

  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

type HeaderProps = {
  connectionStatus: ConnectionStatusType;
  tickCount: number;
  lastUpdatedAt: number | null;
  currentTime: Date;
  isWeekendMode: boolean;
};

const formatDateTime = (date: Date | number | null) => {
  if (date === null) {
    return '--';
  }

  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

export const Header = ({
  connectionStatus,
  tickCount,
  lastUpdatedAt,
  currentTime,
  isWeekendMode,
}: HeaderProps) => (
  <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">
            Anyanical Market Board
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            {isWeekendMode ? '土日も動く相場ボード' : '24時間相場ボード'}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {isWeekendMode ? '週末・祝日も動く参考価格' : '通常銘柄の24時間参考価格'}
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
            {isWeekendMode
              ? '金・銀・原油・S&P500・日経225など、公式市場が休みの間も動く24時間取引価格を参考に、週末ニュースでどれだけ動いたかを確認します。変動率は金曜クローズ付近の価格との比較です。'
              : '金・銀・原油・S&P500・日経225などの24時間取引価格を通常の銘柄名で表示します。週末や閉場時はサンデー相場として、金曜基準からの動きを確認できます。'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
              isWeekendMode
                ? 'bg-amber-400/15 text-amber-200 ring-amber-300/30'
                : 'bg-slate-400/15 text-slate-200 ring-slate-300/30'
            }`}
          >
            {isWeekendMode ? '週末モード' : '平日モード'}
          </span>
          <ConnectionStatus status={connectionStatus} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-fade-up stagger-1 rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-slate-400">現在時刻 JST</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {formatDateTime(currentTime)}
          </p>
        </div>
        <div className="animate-fade-up stagger-2 rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-slate-400">接続状態</p>
          <p className="mt-1 text-lg font-semibold text-white">{connectionStatus}</p>
        </div>
        {isWeekendMode && getMondayOpenCountdown(currentTime) !== null ? (
          <div className="animate-fade-up stagger-3 rounded-lg border border-amber-300/20 bg-amber-300/[0.08] p-4">
            <p className="text-xs text-amber-200/70">月曜オープンまで (FX基準)</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-amber-100">
              {getMondayOpenCountdown(currentTime)}
            </p>
          </div>
        ) : (
          <div className="animate-fade-up stagger-3 hidden rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:block">
            <p className="text-xs text-slate-400">更新回数</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {tickCount.toLocaleString()}
            </p>
          </div>
        )}
        <div className="animate-fade-up stagger-4 hidden rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:block">
          <p className="text-xs text-slate-400">最終更新時刻</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {formatDateTime(lastUpdatedAt)}
          </p>
        </div>
      </div>
    </div>
  </header>
);
