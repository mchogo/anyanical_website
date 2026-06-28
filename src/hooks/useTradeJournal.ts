import { useEffect, useState } from 'react';

export type TradeDirection = 'long' | 'short';
export type TradeStatus = 'open' | 'closed';
export type PnLMode = 'percent' | 'pips';

export type Trade = {
  id: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  entryAt: string;
  pnlMode: PnLMode;
  lotSize?: number;
  stopLoss?: number;
  takeProfit?: number;
  exitPrice?: number;
  exitAt?: string;
  notes?: string;
  status: TradeStatus;
  createdAt: string;
};

export type TradeStats = {
  total: number;
  open: number;
  closed: number;
  winCount: number;
  winRate: number | null;
  totalPnLPercent: number | null;
  totalPnLPips: number | null;
};

const STORAGE_KEY = 'wmb.trade-journal.trades';

const isTradeDirection = (v: unknown): v is TradeDirection =>
  v === 'long' || v === 'short';
const isTradeStatus = (v: unknown): v is TradeStatus => v === 'open' || v === 'closed';
const isPnLMode = (v: unknown): v is PnLMode => v === 'percent' || v === 'pips';

const isTrade = (v: unknown): v is Trade => {
  if (typeof v !== 'object' || v === null) return false;
  const t = v as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.symbol === 'string' &&
    isTradeDirection(t.direction) &&
    typeof t.entryPrice === 'number' &&
    Number.isFinite(t.entryPrice) &&
    typeof t.entryAt === 'string' &&
    isPnLMode(t.pnlMode) &&
    isTradeStatus(t.status) &&
    typeof t.createdAt === 'string'
  );
};

const loadTrades = (): Trade[] => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isTrade) : [];
  } catch {
    return [];
  }
};

const createId = (): string => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const calculatePnL = (trade: Trade): number | null => {
  if (trade.status !== 'closed' || trade.exitPrice === undefined) return null;
  const sign = trade.direction === 'long' ? 1 : -1;
  if (trade.pnlMode === 'percent') {
    return ((sign * (trade.exitPrice - trade.entryPrice)) / trade.entryPrice) * 100;
  }
  return sign * (trade.exitPrice - trade.entryPrice) * (trade.lotSize ?? 1);
};

export const useTradeJournal = () => {
  const [trades, setTrades] = useState<Trade[]>(loadTrades);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  }, [trades]);

  const addTrade = (input: Omit<Trade, 'id' | 'status' | 'createdAt'>): void => {
    setTrades((prev) => [
      { ...input, id: createId(), status: 'open', createdAt: new Date().toISOString() },
      ...prev,
    ]);
  };

  const closeTrade = (id: string, exitPrice: number, exitAt: string): void => {
    setTrades((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, exitPrice, exitAt, status: 'closed' as const } : t,
      ),
    );
  };

  const deleteTrade = (id: string): void => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  const bulkAddTrades = (inputs: Omit<Trade, 'id' | 'createdAt'>[]): number => {
    const newTrades = inputs.map((input) => ({
      ...input,
      id: createId(),
      createdAt: new Date().toISOString(),
    }));
    setTrades((prev) => [...newTrades, ...prev]);
    return newTrades.length;
  };

  const openTrades = trades.filter((t) => t.status === 'open');
  const closedTrades = trades.filter((t) => t.status === 'closed');

  const closedWithPnL = closedTrades.map((t) => ({ trade: t, pnl: calculatePnL(t) }));
  const winCount = closedWithPnL.filter((x) => (x.pnl ?? 0) > 0).length;

  const percentClosed = closedWithPnL.filter((x) => x.trade.pnlMode === 'percent');
  const pipsClosed = closedWithPnL.filter((x) => x.trade.pnlMode === 'pips');

  const stats: TradeStats = {
    total: trades.length,
    open: openTrades.length,
    closed: closedTrades.length,
    winCount,
    winRate: closedTrades.length > 0 ? (winCount / closedTrades.length) * 100 : null,
    totalPnLPercent:
      percentClosed.length > 0
        ? percentClosed.reduce((sum, x) => sum + (x.pnl ?? 0), 0)
        : null,
    totalPnLPips:
      pipsClosed.length > 0 ? pipsClosed.reduce((sum, x) => sum + (x.pnl ?? 0), 0) : null,
  };

  return { trades, openTrades, closedTrades, stats, addTrade, closeTrade, deleteTrade, bulkAddTrades };
};
