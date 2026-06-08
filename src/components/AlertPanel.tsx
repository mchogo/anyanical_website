import { useMemo, useState } from 'react';

import type {
  Alert,
  AlertCondition,
  NotificationPermissionStatus,
} from '../hooks/useAlerts';

type AlertPanelProps = {
  symbol: string;
  currentPrice: number | null;
  alerts: Alert[];
  addAlert: (symbol: string, condition: AlertCondition, threshold: number) => void;
  removeAlert: (alertId: string) => void;
  requestPermission: () => Promise<void>;
  permissionStatus: NotificationPermissionStatus;
};

const conditionLabels: Record<AlertCondition, string> = {
  above: '以上',
  below: '以下',
};

export const AlertPanel = ({
  symbol,
  currentPrice,
  alerts,
  addAlert,
  removeAlert,
  requestPermission,
  permissionStatus,
}: AlertPanelProps) => {
  const [condition, setCondition] = useState<AlertCondition>('above');
  const [threshold, setThreshold] = useState('');
  const symbolAlerts = useMemo(
    () => alerts.filter((alert) => alert.symbol === symbol),
    [alerts, symbol],
  );

  const handleAddAlert = () => {
    const parsedThreshold = Number(threshold);
    if (!Number.isFinite(parsedThreshold)) {
      return;
    }

    addAlert(symbol, condition, parsedThreshold);
    setThreshold('');
  };

  return (
    <div className="animate-slide-down mt-4 rounded-lg border border-white/10 bg-slate-800/60 p-3 text-sm">
      <p className="mb-3 text-xs leading-5 text-slate-400">
        条件に到達すると画面右下に通知を表示します。ブラウザ通知を許可すると、別タブを見ている時も通知を受け取れます。
      </p>
      <p className="mb-3 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs leading-5 text-amber-100">
        通知は補助機能です。ブラウザ・OS設定、スリープ、通信状態、ページを閉じた状態によって遅延または表示されない場合があります。
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={condition}
          onChange={(event) => setCondition(event.target.value as AlertCondition)}
          className="min-h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-slate-100 outline-none focus:border-cyan-300/60"
        >
          <option value="above">以上</option>
          <option value="below">以下</option>
        </select>
        <input
          type="number"
          step="any"
          value={threshold}
          onChange={(event) => setThreshold(event.target.value)}
          placeholder={currentPrice === null ? '閾値' : String(currentPrice)}
          className="min-h-10 flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-300/60"
        />
        <button
          type="button"
          onClick={handleAddAlert}
          className="min-h-10 rounded-lg bg-cyan-300 px-4 font-bold text-slate-950 transition hover:bg-cyan-200"
        >
          追加
        </button>
      </div>

      {permissionStatus === 'default' ? (
        <button
          type="button"
          onClick={() => void requestPermission()}
          className="mt-3 min-h-10 rounded-lg bg-amber-300 px-4 font-bold text-slate-950 transition hover:bg-amber-200"
        >
          通知を許可する
        </button>
      ) : null}

      {permissionStatus === 'denied' ? (
        <p className="mt-3 text-xs leading-5 text-amber-200">
          ブラウザ側で通知が拒否されています。通知を使う場合はブラウザ設定を確認してください。
        </p>
      ) : null}

      {permissionStatus === 'unsupported' ? (
        <p className="mt-3 text-xs leading-5 text-slate-500">
          このブラウザでは通知機能を利用できません。
        </p>
      ) : null}

      <div className="mt-3 space-y-2">
        {symbolAlerts.length === 0 ? (
          <p className="text-xs text-slate-500">この銘柄のアラートは未設定です。</p>
        ) : (
          symbolAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/60 px-3 py-2"
            >
              <span className="text-xs text-slate-300">
                {conditionLabels[alert.condition]} {alert.threshold}
                {alert.fired ? ' / 発火済み' : ''}
              </span>
              <button
                type="button"
                onClick={() => removeAlert(alert.id)}
                className="rounded-md px-2 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-300/10"
              >
                削除
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
