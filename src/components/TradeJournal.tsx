import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

import { MARKETS } from '../config/markets';
import { useDiscordAuth } from '../hooks/useDiscordAuth';
import {
  calculatePnL,
  useTradeJournal,
  type PnLMode,
  type Trade,
  type TradeDirection,
  type TradeStats,
} from '../hooks/useTradeJournal';

const SYMBOL_OPTIONS = MARKETS.map((m) => m.label);

const INPUT_CLS =
  'w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none';

const LABEL_CLS = 'block text-xs font-semibold text-slate-400';

const nowDatetimeLocal = () => new Date().toISOString().slice(0, 16);

const toIso = (datetimeLocal: string): string => {
  try {
    return new Date(datetimeLocal).toISOString();
  } catch {
    return datetimeLocal;
  }
};

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const formatPnL = (trade: Trade): string => {
  const pnl = calculatePnL(trade);
  if (pnl === null) return '-';
  const sign = pnl >= 0 ? '+' : '';
  if (trade.pnlMode === 'percent') return `${sign}${pnl.toFixed(2)}%`;
  return `${sign}${pnl.toFixed(2)} pips`;
};

const isPnLWin = (trade: Trade): boolean | null => {
  const pnl = calculatePnL(trade);
  if (pnl === null) return null;
  return pnl > 0;
};

type ImportedTrade = Omit<Trade, 'id' | 'createdAt'>;

const parseMt4Date = (s: string): string => {
  const m = s.trim().match(/^(\d{4})\.(\d{2})\.(\d{2}) (\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const [, yr, mo, dy, hr, mn, sc = '00'] = m;
    return new Date(`${yr}-${mo}-${dy}T${hr}:${mn}:${sc}`).toISOString();
  }
  return new Date(s).toISOString();
};

const rowToTrade = (cells: string[]): ImportedTrade | null => {
  if (cells.length < 14) return null;
  const type = cells[2].toLowerCase().trim();
  if (type !== 'buy' && type !== 'sell') return null;

  const entryPrice = parseFloat(cells[5]);
  const exitPrice = parseFloat(cells[9]);
  const lotSize = parseFloat(cells[3]);
  const sl = parseFloat(cells[6]);
  const tp = parseFloat(cells[7]);
  const symbol = cells[4].trim();

  if (!Number.isFinite(entryPrice) || entryPrice <= 0 || !symbol) return null;

  const hasExit = Number.isFinite(exitPrice) && exitPrice > 0 && cells[8].trim() !== '';
  return {
    symbol,
    direction: type === 'buy' ? 'long' : 'short',
    entryPrice,
    entryAt: parseMt4Date(cells[1]),
    pnlMode: 'pips',
    lotSize: Number.isFinite(lotSize) && lotSize > 0 ? lotSize : undefined,
    stopLoss: Number.isFinite(sl) && sl > 0 ? sl : undefined,
    takeProfit: Number.isFinite(tp) && tp > 0 ? tp : undefined,
    exitPrice: hasExit ? exitPrice : undefined,
    exitAt: hasExit ? parseMt4Date(cells[8]) : undefined,
    status: hasExit ? 'closed' : 'open',
  };
};

const parseMt4Html = (html: string): ImportedTrade[] => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const trades: ImportedTrade[] = [];
  for (const row of Array.from(doc.querySelectorAll('tr'))) {
    const cells = Array.from(row.querySelectorAll('td')).map(
      (td) => td.textContent?.trim() ?? '',
    );
    const trade = rowToTrade(cells);
    if (trade) trades.push(trade);
  }
  return trades;
};

const parseMt4Xlsx = (buffer: ArrayBuffer): ImportedTrade[] => {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 }) as unknown[][];
  const trades: ImportedTrade[] = [];
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const cells = (row as unknown[]).map((c) =>
      c !== null && c !== undefined ? String(c).trim() : '',
    );
    const trade = rowToTrade(cells);
    if (trade) trades.push(trade);
  }
  return trades;
};

const exportCsv = (trades: Trade[]): void => {
  const headers = [
    '銘柄',
    '方向',
    '損益方式',
    'エントリー価格',
    'エントリー日時',
    'ロット',
    'SL',
    'TP',
    '決済価格',
    '決済日時',
    '損益',
    'メモ',
  ];
  const rows = trades.map((t) => {
    const pnl = calculatePnL(t);
    const pnlStr =
      pnl !== null
        ? t.pnlMode === 'percent'
          ? `${pnl.toFixed(4)}%`
          : `${pnl.toFixed(4)}pips`
        : '';
    return [
      t.symbol,
      t.direction === 'long' ? 'Long' : 'Short',
      t.pnlMode,
      String(t.entryPrice),
      t.entryAt,
      t.lotSize !== undefined ? String(t.lotSize) : '',
      t.stopLoss !== undefined ? String(t.stopLoss) : '',
      t.takeProfit !== undefined ? String(t.takeProfit) : '',
      t.exitPrice !== undefined ? String(t.exitPrice) : '',
      t.exitAt ?? '',
      pnlStr,
      t.notes ?? '',
    ];
  });
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trade-journal-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const LoginGate = ({ onSignIn }: { onSignIn: () => void }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.035] p-8 text-center">
    <p className="text-base font-bold text-white">Discordログインが必要です</p>
    <p className="mt-2 text-sm leading-6 text-slate-400">
      トレード日誌はDiscordログイン後にご利用いただけます。
    </p>
    <button
      onClick={onSignIn}
      className="mt-6 inline-flex min-h-10 items-center justify-center rounded-full bg-cyan-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
    >
      Discordでログイン
    </button>
  </div>
);

const UpgradeGate = () => (
  <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-8 text-center">
    <p className="text-base font-bold text-amber-100">プレミアム限定機能</p>
    <p className="mt-2 text-sm leading-6 text-amber-100/80">
      トレード日誌はプレミアム会員専用のツールです。noteメンバーシップに加入してロール付与を受けることでご利用いただけます。
    </p>
    <a
      href="#/tools/participation"
      className="mt-6 inline-flex min-h-10 items-center justify-center rounded-full bg-amber-200 px-5 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
    >
      プレミアムを確認する
    </a>
  </div>
);

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-white">{value}</p>
  </div>
);

const StatsBar = ({ stats }: { stats: TradeStats }) => {
  const pnlParts: string[] = [];
  if (stats.totalPnLPercent !== null) {
    const sign = stats.totalPnLPercent >= 0 ? '+' : '';
    pnlParts.push(`${sign}${stats.totalPnLPercent.toFixed(2)}%`);
  }
  if (stats.totalPnLPips !== null) {
    const sign = stats.totalPnLPips >= 0 ? '+' : '';
    pnlParts.push(`${sign}${stats.totalPnLPips.toFixed(2)} pips`);
  }
  const pnlDisplay = pnlParts.length > 0 ? pnlParts.join(' / ') : '-';
  const hasPnL = stats.totalPnLPercent !== null || stats.totalPnLPips !== null;
  const pnlIsPositive =
    hasPnL && (stats.totalPnLPercent ?? 0) + (stats.totalPnLPips ?? 0) >= 0;

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="総取引数" value={String(stats.total)} />
      <StatCard label="オープン中" value={String(stats.open)} />
      <StatCard
        label="勝率"
        value={stats.winRate !== null ? `${stats.winRate.toFixed(0)}%` : '-'}
      />
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <p className="text-xs text-slate-500">合計損益</p>
        <p
          className={`mt-1 text-lg font-bold ${
            !hasPnL
              ? 'text-slate-500'
              : pnlIsPositive
                ? 'text-emerald-300'
                : 'text-rose-300'
          }`}
        >
          {pnlDisplay}
        </p>
      </div>
    </div>
  );
};

type NewTradeFormValues = {
  symbol: string;
  direction: TradeDirection;
  pnlMode: PnLMode;
  entryPrice: string;
  entryAt: string;
  lotSize: string;
  stopLoss: string;
  takeProfit: string;
  notes: string;
};

const defaultFormValues = (): NewTradeFormValues => ({
  symbol: '',
  direction: 'long',
  pnlMode: 'percent',
  entryPrice: '',
  entryAt: nowDatetimeLocal(),
  lotSize: '',
  stopLoss: '',
  takeProfit: '',
  notes: '',
});

const NewTradeForm = ({
  onAdd,
  onCancel,
}: {
  onAdd: (trade: Omit<Trade, 'id' | 'status' | 'createdAt'>) => void;
  onCancel: () => void;
}) => {
  const [form, setForm] = useState<NewTradeFormValues>(defaultFormValues);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof NewTradeFormValues, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.symbol.trim()) {
      setError('銘柄を入力してください');
      return;
    }
    const entryPrice = parseFloat(form.entryPrice);
    if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
      setError('正しいエントリー価格を入力してください');
      return;
    }
    if (!form.entryAt) {
      setError('エントリー日時を入力してください');
      return;
    }
    const lotSize = form.lotSize ? parseFloat(form.lotSize) : undefined;
    if (
      form.pnlMode === 'pips' &&
      (!lotSize || !Number.isFinite(lotSize) || lotSize <= 0)
    ) {
      setError('pipsモードではロット数が必要です');
      return;
    }
    onAdd({
      symbol: form.symbol.trim(),
      direction: form.direction,
      pnlMode: form.pnlMode,
      entryPrice,
      entryAt: toIso(form.entryAt),
      lotSize,
      stopLoss: form.stopLoss ? parseFloat(form.stopLoss) || undefined : undefined,
      takeProfit: form.takeProfit ? parseFloat(form.takeProfit) || undefined : undefined,
      notes: form.notes.trim() || undefined,
    });
    setError(null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-5"
    >
      <h3 className="mb-4 text-sm font-bold text-white">新規取引を記録</h3>

      {error && (
        <p className="mb-4 rounded-lg border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLS}>銘柄</label>
          <input
            list="trade-journal-symbol-options"
            value={form.symbol}
            onChange={(e) => set('symbol', e.target.value)}
            placeholder="GOLD, USD/JPY, BTC ..."
            className={`mt-1 ${INPUT_CLS}`}
          />
          <datalist id="trade-journal-symbol-options">
            {SYMBOL_OPTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <p className={LABEL_CLS}>方向</p>
            <div className="mt-1 flex overflow-hidden rounded-lg ring-1 ring-white/10">
              <button
                type="button"
                onClick={() => set('direction', 'long')}
                className={`flex-1 py-2 text-sm font-bold transition ${
                  form.direction === 'long'
                    ? 'bg-cyan-300 text-slate-950'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white'
                }`}
              >
                Long
              </button>
              <button
                type="button"
                onClick={() => set('direction', 'short')}
                className={`flex-1 py-2 text-sm font-bold transition ${
                  form.direction === 'short'
                    ? 'bg-rose-400 text-white'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white'
                }`}
              >
                Short
              </button>
            </div>
          </div>
          <div>
            <p className={LABEL_CLS}>損益方式</p>
            <div className="mt-1 flex overflow-hidden rounded-lg ring-1 ring-white/10">
              <button
                type="button"
                onClick={() => set('pnlMode', 'percent')}
                className={`flex-1 py-2 text-sm font-bold transition ${
                  form.pnlMode === 'percent'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white'
                }`}
              >
                ％
              </button>
              <button
                type="button"
                onClick={() => set('pnlMode', 'pips')}
                className={`flex-1 py-2 text-sm font-bold transition ${
                  form.pnlMode === 'pips'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white'
                }`}
              >
                pips
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className={LABEL_CLS}>エントリー価格</label>
          <input
            type="number"
            step="any"
            min="0"
            value={form.entryPrice}
            onChange={(e) => set('entryPrice', e.target.value)}
            placeholder="例: 2650.00"
            className={`mt-1 ${INPUT_CLS}`}
          />
        </div>

        <div>
          <label className={LABEL_CLS}>エントリー日時</label>
          <input
            type="datetime-local"
            value={form.entryAt}
            onChange={(e) => set('entryAt', e.target.value)}
            className={`mt-1 ${INPUT_CLS}`}
          />
        </div>

        {form.pnlMode === 'pips' && (
          <div>
            <label className={LABEL_CLS}>ロット数</label>
            <input
              type="number"
              step="any"
              min="0"
              value={form.lotSize}
              onChange={(e) => set('lotSize', e.target.value)}
              placeholder="例: 0.1"
              className={`mt-1 ${INPUT_CLS}`}
            />
          </div>
        )}

        <div>
          <label className={LABEL_CLS}>SL（任意）</label>
          <input
            type="number"
            step="any"
            value={form.stopLoss}
            onChange={(e) => set('stopLoss', e.target.value)}
            placeholder="損切り価格"
            className={`mt-1 ${INPUT_CLS}`}
          />
        </div>

        <div>
          <label className={LABEL_CLS}>TP（任意）</label>
          <input
            type="number"
            step="any"
            value={form.takeProfit}
            onChange={(e) => set('takeProfit', e.target.value)}
            placeholder="利確価格"
            className={`mt-1 ${INPUT_CLS}`}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={LABEL_CLS}>メモ（任意）</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="エントリー理由、相場環境など"
            className={`mt-1 resize-none ${INPUT_CLS}`}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="inline-flex min-h-9 items-center justify-center rounded-full bg-cyan-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
        >
          記録する
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-9 items-center justify-center rounded-full bg-white/[0.04] px-4 text-sm font-bold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
};

const CloseTradeForm = ({
  onClose,
  onCancel,
}: {
  onClose: (exitPrice: number, exitAt: string) => void;
  onCancel: () => void;
}) => {
  const [exitPrice, setExitPrice] = useState('');
  const [exitAt, setExitAt] = useState(nowDatetimeLocal);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(exitPrice);
    if (!Number.isFinite(price) || price <= 0) {
      setError('正しい決済価格を入力してください');
      return;
    }
    onClose(price, toIso(exitAt));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3"
    >
      <p className="mb-2 text-xs font-semibold text-slate-400">決済情報を入力</p>
      {error && <p className="mb-2 text-xs text-rose-300">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <input
          type="number"
          step="any"
          min="0"
          value={exitPrice}
          onChange={(e) => setExitPrice(e.target.value)}
          placeholder="決済価格"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
        />
        <input
          type="datetime-local"
          value={exitAt}
          onChange={(e) => setExitAt(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white focus:border-cyan-300/50 focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex min-h-8 items-center justify-center rounded-full bg-cyan-300 px-4 text-xs font-bold text-slate-950 transition hover:bg-cyan-200"
        >
          確定
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-8 items-center justify-center rounded-full bg-white/[0.04] px-4 text-xs font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
};

const TradeCard = ({
  trade,
  onDelete,
  onClose,
  isClosing,
  onStartClose,
  onCancelClose,
}: {
  trade: Trade;
  onDelete: () => void;
  onClose?: (exitPrice: number, exitAt: string) => void;
  isClosing?: boolean;
  onStartClose?: () => void;
  onCancelClose?: () => void;
}) => {
  const pnl = trade.status === 'closed' ? formatPnL(trade) : null;
  const pnlWin = trade.status === 'closed' ? isPnLWin(trade) : null;

  const handleDelete = () => {
    if (window.confirm(`${trade.symbol}の取引記録を削除しますか？`)) {
      onDelete();
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-white">{trade.symbol}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${
              trade.direction === 'long'
                ? 'bg-cyan-300/10 text-cyan-200 ring-cyan-300/20'
                : 'bg-rose-300/10 text-rose-300 ring-rose-300/20'
            }`}
          >
            {trade.direction === 'long' ? 'Long' : 'Short'}
          </span>
          {pnlWin !== null && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${
                pnlWin
                  ? 'bg-emerald-300/10 text-emerald-300 ring-emerald-300/20'
                  : 'bg-rose-300/10 text-rose-300 ring-rose-300/20'
              }`}
            >
              {pnlWin ? '勝ち' : '負け'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {pnl !== null && (
            <span
              className={`text-sm font-bold ${pnlWin ? 'text-emerald-300' : 'text-rose-300'}`}
            >
              {pnl}
            </span>
          )}
          {trade.status === 'open' && onStartClose && !isClosing && (
            <button
              onClick={onStartClose}
              className="inline-flex min-h-7 items-center justify-center rounded-full bg-white/[0.06] px-3 text-xs font-bold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10"
            >
              決済
            </button>
          )}
          <button
            onClick={handleDelete}
            aria-label="削除"
            className="grid h-6 w-6 place-items-center rounded-full text-slate-600 transition hover:bg-white/10 hover:text-slate-300"
          >
            ×
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>
          エントリー <span className="text-slate-300">{trade.entryPrice}</span>
        </span>
        <span>{formatDate(trade.entryAt)}</span>
        {trade.stopLoss !== undefined && (
          <span>
            SL <span className="text-rose-300/70">{trade.stopLoss}</span>
          </span>
        )}
        {trade.takeProfit !== undefined && (
          <span>
            TP <span className="text-emerald-300/70">{trade.takeProfit}</span>
          </span>
        )}
        {trade.pnlMode === 'pips' && trade.lotSize !== undefined && (
          <span>{trade.lotSize} lot</span>
        )}
        {trade.status === 'closed' && trade.exitPrice !== undefined && (
          <>
            <span>
              決済 <span className="text-slate-300">{trade.exitPrice}</span>
            </span>
            {trade.exitAt && <span>{formatDate(trade.exitAt)}</span>}
          </>
        )}
      </div>

      {trade.notes && (
        <p className="mt-2 text-xs leading-5 text-slate-500">{trade.notes}</p>
      )}

      {isClosing && onClose && onCancelClose && (
        <CloseTradeForm onClose={onClose} onCancel={onCancelClose} />
      )}
    </div>
  );
};

export const TradeJournalTool = () => {
  const auth = useDiscordAuth();
  const { openTrades, closedTrades, stats, addTrade, closeTrade, deleteTrade, bulkAddTrades } =
    useTradeJournal();
  const [showNewForm, setShowNewForm] = useState(false);
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    reader.onload = (ev) => {
      try {
        let trades: ImportedTrade[];
        if (ext === 'htm' || ext === 'html') {
          trades = parseMt4Html(ev.target?.result as string);
        } else {
          trades = parseMt4Xlsx(ev.target?.result as ArrayBuffer);
        }
        if (trades.length === 0) {
          setImportMessage({ text: 'MT4の取引データが見つかりませんでした', ok: false });
        } else {
          const count = bulkAddTrades(trades);
          setImportMessage({ text: `${count}件の取引をインポートしました`, ok: true });
        }
      } catch {
        setImportMessage({ text: 'ファイルの読み込みに失敗しました', ok: false });
      }
      e.target.value = '';
      setTimeout(() => setImportMessage(null), 4000);
    };

    if (ext === 'htm' || ext === 'html') {
      reader.readAsText(file, 'utf-8');
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  if (!auth.isAuthenticated) {
    if (!auth.isConfigured) return null;
    return <LoginGate onSignIn={() => auth.signIn('#/tools/trade-journal')} />;
  }

  if (!auth.canAccessPremium) {
    return <UpgradeGate />;
  }

  return (
    <div>
      <StatsBar stats={stats} />

      {importMessage && (
        <div
          className={`mb-4 rounded-lg border px-4 py-2 text-sm ${
            importMessage.ok
              ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200'
              : 'border-rose-300/30 bg-rose-300/10 text-rose-200'
          }`}
        >
          {importMessage.text}
        </div>
      )}

      {!showNewForm ? (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setShowNewForm(true)}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-cyan-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
          >
            ＋ 新規取引を記録
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-white/[0.04] px-5 text-sm font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
          >
            MT4インポート
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".htm,.html,.xlsx,.xls"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      ) : (
        <NewTradeForm
          onAdd={(trade) => {
            addTrade(trade);
            setShowNewForm(false);
          }}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {openTrades.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-bold text-white">
            オープン中{' '}
            <span className="font-normal text-slate-500">({openTrades.length})</span>
          </h2>
          <div className="flex flex-col gap-3">
            {openTrades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                onDelete={() => deleteTrade(trade.id)}
                isClosing={closingTradeId === trade.id}
                onStartClose={() => setClosingTradeId(trade.id)}
                onCancelClose={() => setClosingTradeId(null)}
                onClose={(exitPrice, exitAt) => {
                  closeTrade(trade.id, exitPrice, exitAt);
                  setClosingTradeId(null);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {openTrades.length === 0 && closedTrades.length === 0 && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-sm text-slate-500">まだ取引記録がありません。</p>
          <p className="mt-1 text-sm text-slate-600">
            上のボタンから最初の取引を記録してみましょう。
          </p>
        </div>
      )}

      {closedTrades.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              クローズ済み{' '}
              <span className="font-normal text-slate-500">({closedTrades.length})</span>
            </h2>
            <button
              onClick={() => exportCsv(closedTrades)}
              className="inline-flex min-h-7 items-center justify-center rounded-full bg-white/[0.04] px-3 text-xs font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
            >
              CSVエクスポート
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {closedTrades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                onDelete={() => deleteTrade(trade.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
