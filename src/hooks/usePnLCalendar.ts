import { useCallback, useEffect, useState } from 'react';

import { useDiscordAuth } from './useDiscordAuth';

export type Account = {
  id: string;
  name: string;
  unit: string;
  createdAt: string;
};

export type DailyRecord = {
  id: string;
  accountId: string;
  date: string; // YYYY-MM-DD
  pnl: number;
  notes?: string;
};

const createId = (): string => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const apiFetch = (path: string, token: string, init?: RequestInit): Promise<Response> =>
  fetch(`/api/pnl/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

export const usePnLCalendar = () => {
  const { session } = useDiscordAuth();
  const token = session?.accessToken ?? null;

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setAccounts([]);
      setRecords([]);
      setError(null);
    }
  }, [token]);

  const fetchAll = useCallback(() => {
    if (!token) return;
    setIsLoading(true);
    const okJson = <T>(r: Response): Promise<T> => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<T>;
    };
    Promise.all([
      apiFetch('accounts', token).then((r) => okJson<Account[]>(r)),
      apiFetch('records', token).then((r) => okJson<DailyRecord[]>(r)),
    ])
      .then(([accs, recs]) => {
        setAccounts(accs);
        setRecords(recs);
        setError(null);
      })
      .catch((err: unknown) => {
        const detail = err instanceof Error ? err.message : String(err);
        setError(`データの読み込みに失敗しました (${detail})`);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addAccount = useCallback(
    (name: string, unit: string): void => {
      if (!token) return;
      const id = createId();
      const createdAt = new Date().toISOString();
      const account: Account = { id, name: name.trim(), unit: unit.trim(), createdAt };
      setAccounts((prev) => [...prev, account]);
      apiFetch('accounts', token, {
        method: 'POST',
        body: JSON.stringify(account),
      }).catch(() => {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        setError('口座の追加に失敗しました');
      });
    },
    [token],
  );

  const deleteAccount = useCallback(
    (id: string): void => {
      if (!token) return;
      const removed = accounts.find((a) => a.id === id);
      const removedRecords = records.filter((r) => r.accountId === id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setRecords((prev) => prev.filter((r) => r.accountId !== id));
      apiFetch(`accounts/${id}`, token, { method: 'DELETE' }).catch(() => {
        if (removed) setAccounts((prev) => [...prev, removed]);
        setRecords((prev) => [...prev, ...removedRecords]);
        setError('口座の削除に失敗しました');
      });
    },
    [token, accounts, records],
  );

  const setRecord = useCallback(
    (accountId: string, date: string, pnl: number, notes?: string): void => {
      if (!token) return;
      const id = createId();
      const trimmedNotes = notes?.trim() || undefined;

      setRecords((prev) => {
        const existing = prev.find((r) => r.accountId === accountId && r.date === date);
        if (existing) {
          return prev.map((r) =>
            r.accountId === accountId && r.date === date
              ? { ...r, id, pnl, notes: trimmedNotes }
              : r,
          );
        }
        return [...prev, { id, accountId, date, pnl, notes: trimmedNotes }];
      });

      apiFetch('records', token, {
        method: 'POST',
        body: JSON.stringify({ id, accountId, date, pnl, notes: trimmedNotes }),
      }).catch(() => {
        void fetchAll();
        setError('記録の保存に失敗しました');
      });
    },
    [token, fetchAll],
  );

  const deleteRecord = useCallback(
    (accountId: string, date: string): void => {
      if (!token) return;
      const removed = records.find((r) => r.accountId === accountId && r.date === date);
      setRecords((prev) =>
        prev.filter((r) => !(r.accountId === accountId && r.date === date)),
      );
      apiFetch(`records/${accountId}/${date}`, token, { method: 'DELETE' }).catch(() => {
        if (removed) setRecords((prev) => [...prev, removed]);
        setError('記録の削除に失敗しました');
      });
    },
    [token, records],
  );

  return {
    accounts,
    records,
    isLoading,
    error,
    addAccount,
    deleteAccount,
    setRecord,
    deleteRecord,
  };
};
