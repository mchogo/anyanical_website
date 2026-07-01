import { useEffect, useState } from 'react';

import type { PnLCardRecord } from '../utils/pnlCard';

export type ShowcaseAccount = {
  accountId: string;
  accountName: string;
  unit: string;
  records: PnLCardRecord[];
};

type ShowcaseData = {
  year: number;
  month: number; // 0-indexed
  accounts: ShowcaseAccount[];
};

type ShowcaseState =
  | { phase: 'loading' }
  | { phase: 'ready'; data: ShowcaseData }
  | { phase: 'empty' }
  | { phase: 'error' };

// Mirrors the worker's JST "current month" calculation so the client's
// initial month picker state matches what the server treats as "this month",
// regardless of the visitor's own timezone.
export const getJstYearMonth = (): { year: number; month: number } => {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date());
  const [yearStr, monthStr] = ymd.split('-');
  return { year: Number(yearStr), month: Number(monthStr) - 1 };
};

export const usePnLShowcase = (year: number, month: number): ShowcaseState => {
  const [state, setState] = useState<ShowcaseState>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ phase: 'loading' });
    const params = new URLSearchParams({ year: String(year), month: String(month) });
    fetch(`/api/pnl/showcase?${params}`)
      .then((res) => {
        if (res.status === 404 || res.status === 400) return null;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ShowcaseData>;
      })
      .then((data) => {
        if (cancelled) return;
        setState(data && data.accounts.length > 0 ? { phase: 'ready', data } : { phase: 'empty' });
      })
      .catch(() => {
        if (!cancelled) setState({ phase: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  return state;
};
