import { ConnectionStatus } from './ConnectionStatus';
import type { ConnectionStatus as ConnectionStatusType } from '../hooks/useHyperliquidMids';

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
            Weekend Market Board
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            土日も動く相場ボード
          </h1>
          <p className="mt-2 text-sm text-slate-300">Hyperliquid 24/7 Perp Prices</p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
            分散型取引所 Hyperliquid
            の24時間365日perpで、金・銀・原油・S&P500・日経225の週末変動を確認します。前日比は約24時間前価格との比較です。
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
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-slate-400">現在時刻 JST</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {formatDateTime(currentTime)}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-slate-400">接続状態</p>
          <p className="mt-1 text-lg font-semibold text-white">{connectionStatus}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-slate-400">受信tick数</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {tickCount.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-slate-400">最終更新時刻</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {formatDateTime(lastUpdatedAt)}
          </p>
        </div>
      </div>
    </div>
  </header>
);
