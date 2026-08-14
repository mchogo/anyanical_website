import { useEffect, useState } from 'react';

export type MatomeEntry = {
  id: string;
  entryDate: string;
  sourceUrl: string;
  sourceAuthor: string;
  headline: string;
  commentary: string;
  reactionCount: number;
  createdAt: string;
};

type MatomeState =
  | { phase: 'loading' }
  | { phase: 'ready'; entries: MatomeEntry[] }
  | { phase: 'error' };

// Mirrors the worker's JST "current month" calculation (see usePnLShowcase's
// getJstYearMonth) so the client's initial month matches the server's "now".
// Unlike that hook, matome's API takes a 1-indexed month.
export const getJstYearMonth = (): { year: number; month: number } => {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date());
  const [yearStr, monthStr] = ymd.split('-');
  return { year: Number(yearStr), month: Number(monthStr) };
};

export const useMatomeEntries = (year: number, month: number): MatomeState => {
  const [state, setState] = useState<MatomeState>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ phase: 'loading' });
    const params = new URLSearchParams({ year: String(year), month: String(month) });
    fetch(`/api/matome/entries?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<MatomeEntry[]>;
      })
      .then((entries) => {
        if (!cancelled) setState({ phase: 'ready', entries });
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

// 月に絞らず、直近のエントリを新しい順で最大limit件取得する（トップページ用）。
export const useLatestMatomeEntries = (limit: number): MatomeState => {
  const [state, setState] = useState<MatomeState>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ phase: 'loading' });
    const params = new URLSearchParams({ limit: String(limit) });
    fetch(`/api/matome/entries?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<MatomeEntry[]>;
      })
      .then((entries) => {
        if (!cancelled) setState({ phase: 'ready', entries });
      })
      .catch(() => {
        if (!cancelled) setState({ phase: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return state;
};

type MatomeEntryState =
  | { phase: 'loading' }
  | { phase: 'ready'; entry: MatomeEntry }
  | { phase: 'not-found' }
  | { phase: 'error' };

export const useMatomeEntry = (entryId: string): MatomeEntryState => {
  const [state, setState] = useState<MatomeEntryState>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ phase: 'loading' });
    fetch(`/api/matome/entries/${encodeURIComponent(entryId)}`)
      .then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<MatomeEntry>;
      })
      .then((entry) => {
        if (cancelled) return;
        setState(entry ? { phase: 'ready', entry } : { phase: 'not-found' });
      })
      .catch(() => {
        if (!cancelled) setState({ phase: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  return state;
};

export type MatomeMonth = { ym: string; count: number };

type MatomeMonthsState =
  | { phase: 'loading' }
  | { phase: 'ready'; months: MatomeMonth[] }
  | { phase: 'error' };

// 投稿がある年月の一覧（新しい順）。トップページのアーカイブリンク生成に使う。
export const useMatomeArchiveMonths = (): MatomeMonthsState => {
  const [state, setState] = useState<MatomeMonthsState>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/matome/months')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<MatomeMonth[]>;
      })
      .then((months) => {
        if (!cancelled) setState({ phase: 'ready', months });
      })
      .catch(() => {
        if (!cancelled) setState({ phase: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};

export const formatMonthLabel = (ym: string): string => {
  const [year, month] = ym.split('-');
  return `${year}年${Number(month)}月`;
};

// entryDate("YYYY-MM-DD")を"YYYY年M月D日"表示に変換する。
export const formatDateLabel = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  return `${year}年${Number(month)}月${Number(day)}日`;
};
