import type { ConnectionStatus as ConnectionStatusType } from '../hooks/useHyperliquidMids';

type ConnectionStatusProps = {
  status: ConnectionStatusType;
};

const statusLabel: Record<ConnectionStatusType, string> = {
  connecting: '接続中',
  connected: '接続済み',
  disconnected: '切断',
  error: 'エラー',
};

const statusClassName: Record<ConnectionStatusType, string> = {
  connecting: 'bg-amber-400/15 text-amber-200 ring-amber-300/30',
  connected: 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/30',
  disconnected: 'bg-slate-400/15 text-slate-200 ring-slate-300/30',
  error: 'bg-rose-400/15 text-rose-200 ring-rose-300/30',
};

export const ConnectionStatus = ({ status }: ConnectionStatusProps) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassName[status]}`}
  >
    <span className="h-2 w-2 rounded-full bg-current" />
    {statusLabel[status]}
  </span>
);
