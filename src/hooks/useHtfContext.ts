import { useCallback, useEffect, useState } from 'react';

import type { DiscordAuthSession } from './useDiscordAuth';

export type HtfContextState = {
  symbol: string;
  timeframe: string;
  // aiEnvState: 1=上目線 / -1=下目線 / 2=レンジ(上) / -2=レンジ(下) / 0=レンジ
  state: number;
  refHigh: number | null;
  refLow: number | null;
  reversalWarning: boolean;
  barTime: number;
  updatedAt: string;
};

type UseHtfContextResult = {
  data: HtfContextState[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
};

// GET /api/htf-context はDiscordプレミアムロール限定（Anyanical Toolkit 3.1のAI環境認識
// アラートをWorker側でD1に保存したスナップショットを返す）。非プレミアム/未ログインでは呼ばない。
export const useHtfContext = (
  session: DiscordAuthSession | null,
  canAccessPremium: boolean,
): UseHtfContextResult => {
  const [data, setData] = useState<HtfContextState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!canAccessPremium || !session?.accessToken) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetch('/api/htf-context', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HtfContextState[]>;
      })
      .then((rows) => {
        if (cancelled) return;
        setData(rows);
      })
      .catch(() => {
        if (cancelled) return;
        setError('データを取得できませんでした');
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.accessToken, canAccessPremium, reloadToken]);

  const refresh = useCallback(() => setReloadToken((v) => v + 1), []);

  return { data, isLoading, error, refresh };
};
