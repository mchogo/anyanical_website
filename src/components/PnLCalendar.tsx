import { useEffect, useState } from 'react';

import { SITE_URL } from '../config/pageMeta';
import { useDiscordAuth } from '../hooks/useDiscordAuth';
import { usePnLCalendar, type Account, type DailyRecord } from '../hooks/usePnLCalendar';

const TRADE_JOURNAL_URL = `${SITE_URL}/#/tools/trade-journal`;

// ── Helpers ──────────────────────────────────────────────────────────────────

const toYMD = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const buildCalendarDays = (year: number, month: number): Array<Date | null> => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const cells: Array<Date | null> = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const formatUnit = (pnl: number, unit: string, showPlus = true): string => {
  const sign = pnl > 0 && showPlus ? '+' : '';
  return `${sign}${pnl.toLocaleString('ja-JP')}${unit}`;
};

const cellBg = (pnl: number, maxAbs: number): string => {
  if (maxAbs === 0) return '';
  const opacity = Math.min(Math.abs(pnl) / maxAbs, 1) * 0.65 + 0.15;
  const hex = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return pnl > 0 ? `#6ee7b7${hex}` : `#fca5a5${hex}`;
};

type MonthStats = {
  total: number;
  winDays: number;
  lossDays: number;
  tradeDays: number;
  winRate: number | null;
  best: number | null;
  worst: number | null;
};

const calcStats = (monthRecords: DailyRecord[]): MonthStats => {
  if (monthRecords.length === 0) {
    return {
      total: 0,
      winDays: 0,
      lossDays: 0,
      tradeDays: 0,
      winRate: null,
      best: null,
      worst: null,
    };
  }
  const pnls = monthRecords.map((r) => r.pnl);
  const winDays = pnls.filter((p) => p > 0).length;
  const lossDays = pnls.filter((p) => p < 0).length;
  return {
    total: pnls.reduce((s, p) => s + p, 0),
    winDays,
    lossDays,
    tradeDays: monthRecords.length,
    winRate: monthRecords.length > 0 ? (winDays / monthRecords.length) * 100 : null,
    best: Math.max(...pnls),
    worst: Math.min(...pnls),
  };
};

const parseNumber = (value: string | undefined): number | null => {
  if (!value) return null;
  const raw = value.trim();
  const negativeByParens = raw.startsWith('(') && raw.endsWith(')');
  const normalized = raw.replace(/["¥$,\s()]/g, '');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return negativeByParens ? -Math.abs(parsed) : parsed;
};

const parseTradeDate = (value: string | undefined): string | null => {
  if (!value) return null;
  const text = value.trim().replaceAll('.', '-').replace(/\//g, '-');
  const ymdMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const dmyMatch = text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return null;
};

const parseCsvLine = (line: string, delimiter: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells.map((cell) => cell.replace(/^"|"$/g, ''));
};

const detectDelimiter = (line: string) => {
  const candidates = [',', '\t', ';'];
  return candidates.reduce((best, delimiter) =>
    line.split(delimiter).length > line.split(best).length ? delimiter : best,
  );
};

const normalizeHeader = (value: string) =>
  value.toLowerCase().replace(/[\s_./()（）-]/g, '');

const findColumn = (headers: string[], candidates: string[]) =>
  headers.findIndex((header) =>
    candidates.some((candidate) => normalizeHeader(header).includes(candidate)),
  );

const parseMt4DateToYmd = (s: string): string | null => {
  const m = s.trim().match(/^(\d{4})[./](\d{2})[./](\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
};

type Mt4ColumnMap = {
  closeTimeIdx: number;
  typeIdx: number;
  profitIdx: number;
  swapIdx: number;
  commissionIdx: number;
};

const TRADE_TYPES = new Set(['buy', 'sell', 'buy limit', 'sell limit', 'buy stop', 'sell stop']);

const normHeader = (s: string) => s.toLowerCase().replace(/[\s_.()（）【】\[\]\/]/g, '');

const detectMt4Columns = (headers: string[]): Mt4ColumnMap | null => {
  const n = headers.map(normHeader);

  // Profit column is the anchor — if missing, not a trade history sheet
  const profitIdx = n.findIndex((h) => h === 'profit' || h === '損益' || h.endsWith('profit'));
  if (profitIdx === -1) return null;

  // Close time: use LAST occurrence of a "time" column (open time comes first)
  const timeIndices = n.reduce<number[]>((acc, h, i) => {
    if (h.includes('time') || h === '時間' || h.includes('closetime') || h.includes('決済時刻')) acc.push(i);
    return acc;
  }, []);
  const closeTimeIdx = timeIndices.length > 0 ? timeIndices[timeIndices.length - 1] : -1;
  if (closeTimeIdx === -1) return null;

  const typeIdx = n.findIndex((h) => h === 'type' || h === 'タイプ');
  const swapIdx = n.findIndex((h) => h.includes('swap') || h.includes('スワップ'));
  const commissionIdx = n.findIndex((h) => h.includes('commission') || h.includes('手数料'));

  return { closeTimeIdx, typeIdx, profitIdx, swapIdx, commissionIdx };
};

const KNOWN_CURRENCIES = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'NZD'];

const detectCurrency = (text: string): string | undefined => {
  const m = text.match(/Currency[:\s]+([A-Z]{3})/i) ?? text.match(/\(([A-Z]{3})[,)]/);
  const code = m?.[1]?.toUpperCase();
  return code && KNOWN_CURRENCIES.includes(code) ? code : undefined;
};

type ParseResult = { dailyPnls: Map<string, number>; currency?: string; dailyNotes?: Map<string, string> };

const aggregateRows = (allRows: string[][]): Map<string, number> => {
  const byDate = new Map<string, number>();

  // Find header row in the first 20 rows
  let columns: Mt4ColumnMap | null = null;
  let dataStart = -1;
  for (let i = 0; i < Math.min(allRows.length, 20); i++) {
    const cols = detectMt4Columns(allRows[i]);
    if (cols) { columns = cols; dataStart = i + 1; break; }
  }
  if (!columns || dataStart === -1) return byDate;

  const { typeIdx } = columns;

  // MT5 HTML has an extra hidden column after typeIdx not in the header.
  // Detect it by checking whether the first trade row has a date at the expected closeTimeIdx.
  let colAdjust = 0;
  for (let i = dataStart; i < Math.min(dataStart + 20, allRows.length); i++) {
    const row = allRows[i];
    if (!row || row.length === 0) continue;
    if (typeIdx !== -1 && !TRADE_TYPES.has((row[typeIdx] ?? '').toLowerCase().trim())) continue;
    if (parseMt4DateToYmd(row[columns.closeTimeIdx] ?? '')) { colAdjust = 0; break; }
    if (parseMt4DateToYmd(row[columns.closeTimeIdx + 1] ?? '')) { colAdjust = 1; break; }
    break;
  }

  const closeTimeIdx = columns.closeTimeIdx + colAdjust;
  const profitIdx = columns.profitIdx + colAdjust;
  const swapIdx = columns.swapIdx !== -1 ? columns.swapIdx + colAdjust : -1;
  const commissionIdx = columns.commissionIdx !== -1 ? columns.commissionIdx + colAdjust : -1;

  for (let i = dataStart; i < allRows.length; i++) {
    const cells = allRows[i];
    if (!cells || cells.length <= profitIdx) continue;
    if (typeIdx !== -1 && !TRADE_TYPES.has((cells[typeIdx] ?? '').toLowerCase().trim())) continue;

    const date = parseMt4DateToYmd(cells[closeTimeIdx] ?? '');
    if (!date) continue;

    const profit = parseNumber(cells[profitIdx]);
    if (profit === null) continue;

    const swap = swapIdx !== -1 ? (parseNumber(cells[swapIdx]) ?? 0) : 0;
    const commission = commissionIdx !== -1 ? (parseNumber(cells[commissionIdx]) ?? 0) : 0;

    byDate.set(date, (byDate.get(date) ?? 0) + profit + swap + commission);
  }

  return byDate;
};

const decodeHtmlBuffer = (buf: ArrayBuffer): string => {
  const b = new Uint8Array(buf);
  if (b[0] === 0xff && b[1] === 0xfe) return new TextDecoder('utf-16le').decode(buf);
  if (b[0] === 0xfe && b[1] === 0xff) return new TextDecoder('utf-16be').decode(buf);
  return new TextDecoder('utf-8').decode(buf);
};

const parseMt4Html = (html: string): ParseResult => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const rows = Array.from(doc.querySelectorAll('tr')).map((row) =>
    Array.from(row.querySelectorAll('td, th')).map((cell) => cell.textContent?.trim() ?? ''),
  );
  return { dailyPnls: aggregateRows(rows), currency: detectCurrency(doc.body.textContent ?? '') };
};


const parseTradeCsv = (text: string): ParseResult => {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return { dailyPnls: new Map() };

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);
  const closeTimeIndex = findColumn(headers, [
    'closetime',
    'time',
    '決済時刻',
    '決済時間',
    '決済日時',
    '約定日時',
    '日時',
    '日付',
  ]);
  const profitIndex = findColumn(headers, ['profit', '損益']);
  const swapIndex = findColumn(headers, ['swap', 'スワップ']);
  const commissionIndex = findColumn(headers, ['commission', '手数料']);
  const notesIndex = findColumn(headers, ['memo', 'notes', 'note', 'メモ', '備考', 'コメント']);

  if (closeTimeIndex === -1 || profitIndex === -1) return { dailyPnls: new Map() };

  const byDate = new Map<string, number>();
  const byDateNotes = new Map<string, string>();
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line, delimiter);
    const date = parseTradeDate(cells[closeTimeIndex]);
    const profit = parseNumber(cells[profitIndex]);
    if (!date || profit === null) continue;
    const swap = parseNumber(cells[swapIndex]) ?? 0;
    const commission = parseNumber(cells[commissionIndex]) ?? 0;
    byDate.set(date, (byDate.get(date) ?? 0) + profit + swap + commission);
    if (notesIndex !== -1) {
      const note = cells[notesIndex]?.trim();
      if (note) byDateNotes.set(date, note);
    }
  }
  return { dailyPnls: byDate, dailyNotes: notesIndex !== -1 ? byDateNotes : undefined };
};

// ── Gate components ───────────────────────────────────────────────────────────

const LoginGate = ({ onSignIn }: { onSignIn: () => void }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.035] p-8 text-center animate-slide-up">
    <p className="text-base font-bold text-white">Discordログインが必要です</p>
    <p className="mt-2 text-sm leading-6 text-slate-400">
      損益カレンダーはDiscordログイン後にご利用いただけます。
    </p>
    <button
      onClick={onSignIn}
      className="mt-6 inline-flex min-h-10 items-center justify-center rounded-full bg-cyan-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
    >
      Discordでログイン
    </button>
  </div>
);

// ── Account tab bar ───────────────────────────────────────────────────────────

const AccountTabs = ({
  accounts,
  selectedId,
  onSelect,
  onAddClick,
  canUseMultiAccount,
}: {
  accounts: Account[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAddClick: () => void;
  canUseMultiAccount: boolean;
}) => (
  <div className="mb-4 flex flex-wrap gap-2">
    {accounts.map((a) => (
      <button
        key={a.id}
        onClick={() => onSelect(a.id)}
        className={`min-h-9 rounded-full px-4 text-sm font-bold ring-1 transition ${
          selectedId === a.id
            ? 'bg-cyan-300 text-slate-950 ring-cyan-200'
            : 'bg-white/[0.04] text-slate-300 ring-white/10 hover:bg-white/10'
        }`}
      >
        {a.name}
      </button>
    ))}
    {canUseMultiAccount && accounts.length > 1 && (
      <button
        onClick={() => onSelect('__all__')}
        className={`min-h-9 rounded-full px-4 text-sm font-bold ring-1 transition ${
          selectedId === '__all__'
            ? 'bg-white/20 text-white ring-white/30'
            : 'bg-white/[0.04] text-slate-400 ring-white/10 hover:bg-white/10'
        }`}
      >
        全口座合計
      </button>
    )}
    <button
      onClick={onAddClick}
      className="min-h-9 rounded-full bg-white/[0.04] px-4 text-sm font-bold text-slate-400 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
    >
      ＋ 口座追加{canUseMultiAccount ? '' : '（Premium）'}
    </button>
  </div>
);

const PremiumUpsellModal = ({ onClose }: { onClose: () => void }) => {
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(onClose, 160);
    return () => window.clearTimeout(t);
  }, [closing, onClose]);
  const close = () => setClosing(true);
  return (
  <div
    className={`fixed inset-0 z-[70] grid place-items-center bg-slate-950/80 px-4 backdrop-blur-sm ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
    onClick={close}
  >
    <div
      className={`w-full max-w-md rounded-lg border border-amber-300/30 bg-slate-950 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] ${closing ? 'animate-slide-down' : 'animate-slide-up'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-sm font-semibold text-amber-100">Premium feature</p>
      <h3 className="mt-1 text-xl font-bold text-white">複数口座はプレミアム限定です</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Discordログインのみでも1口座の損益カレンダーは使えます。複数口座、全口座合計、より細かい運用管理はプレミアムで解放されます。
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href="#/tools/participation"
          onClick={close}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-amber-200 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
        >
          プレミアム内容を見る
        </a>
        <button
          type="button"
          onClick={close}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-white/[0.04] px-4 text-sm font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          閉じる
        </button>
      </div>
    </div>
  </div>
  );
};

// ── Account forms ──────────────────────────────────────────────────────────────

const UNIT_SUGGESTIONS = ['円', 'USD', 'EUR', 'pips', '%'];

const AccountForm = ({
  mode,
  initialName = '',
  initialUnit = '円',
  onSubmit,
  onCancel,
}: {
  mode: 'add' | 'edit';
  initialName?: string;
  initialUnit?: string;
  onSubmit: (name: string, unit: string) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState(initialName);
  const [unit, setUnit] = useState(initialUnit);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('口座名を入力してください'); return; }
    if (!unit.trim()) { setError('単位を入力してください'); return; }
    onSubmit(name.trim(), unit.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-4 animate-slide-up"
    >
      <p className="mb-3 text-sm font-bold text-white">
        {mode === 'add' ? '口座を追加' : '口座を編集'}
      </p>
      {error && <p className="mb-3 text-xs text-rose-300">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <div className="min-w-0 flex-1">
          <label className="block text-xs font-semibold text-slate-400">口座名</label>
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="XM口座、HFM口座 など"
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
          />
        </div>
        <div className="w-32 shrink-0">
          <label className="block text-xs font-semibold text-slate-400">単位</label>
          <input
            list="unit-options"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="円"
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
          />
          <datalist id="unit-options">
            {UNIT_SUGGESTIONS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="inline-flex min-h-8 items-center justify-center rounded-full bg-cyan-300 px-4 text-xs font-bold text-slate-950 transition hover:bg-cyan-200"
        >
          {mode === 'add' ? '追加' : '保存'}
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

// ── Import guide overlay ──────────────────────────────────────────────────────

const ImportGuideModal = ({ onClose }: { onClose: () => void }) => {
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(onClose, 160);
    return () => window.clearTimeout(t);
  }, [closing, onClose]);
  const close = () => setClosing(true);
  return (
  <div
    className={`fixed inset-0 z-[70] grid place-items-center bg-slate-950/80 px-4 backdrop-blur-sm ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
    onClick={close}
  >
    <div
      className={`w-full max-w-lg rounded-xl border border-white/10 bg-slate-900 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.6)] ${closing ? 'animate-slide-down' : 'animate-slide-up'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-white">MT4 / MT5 履歴の取り込み方法</h3>
        <button
          onClick={close}
          className="shrink-0 text-slate-500 transition hover:text-white"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>

      <div className="space-y-5 text-sm">
        {/* MT4 */}
        <div>
          <p className="mb-2 font-bold text-cyan-300">MT4 の場合</p>
          <ol className="space-y-1.5 text-slate-300">
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-400">1</span>
              <span>MT4 を開き、上部メニューの <strong className="text-white">「表示」→「ターミナル」</strong> を開く</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-400">2</span>
              <span>ターミナル内の <strong className="text-white">「口座履歴」</strong> タブを選択</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-400">3</span>
              <span>期間を右クリック →「すべての履歴」など期間を選択</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-400">4</span>
              <span>再度右クリック → <strong className="text-white">「詳細な履歴のHTMLレポートを保存」</strong> をクリック</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-400">5</span>
              <span>保存した <strong className="text-white">.htm ファイル</strong> をここで選択</span>
            </li>
          </ol>
        </div>

        <div className="border-t border-white/10" />

        {/* MT5 */}
        <div>
          <p className="mb-2 font-bold text-cyan-300">MT5 の場合</p>
          <ol className="space-y-1.5 text-slate-300">
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-400">1</span>
              <span>MT5 を開き、<strong className="text-white">「表示」→「ツールボックス」</strong>（または Ctrl+T）を開く</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-400">2</span>
              <span><strong className="text-white">「履歴」</strong> タブを選択し、期間を設定</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-400">3</span>
              <span>右クリック → <strong className="text-white">「レポート」→「HTML形式で保存」</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-400">4</span>
              <span>保存した <strong className="text-white">.html ファイル</strong> をここで選択</span>
            </li>
          </ol>
        </div>

        <div className="border-t border-white/10" />

        <p className="text-xs text-slate-500">
          XLSX形式は非対応です。HTML形式のみ対応しています。CSVはMT4/MT5の「CSVとして保存」でも取り込めます。
        </p>
      </div>

      <button
        onClick={close}
        className="mt-5 inline-flex min-h-9 w-full items-center justify-center rounded-full bg-white/[0.06] text-sm font-bold text-slate-300 transition hover:bg-white/10"
      >
        閉じる
      </button>
    </div>
  </div>
  );
};

// ── CSV import panel ──────────────────────────────────────────────────────────

const CsvImportPanel = ({
  disabled,
  existingDates,
  onImport,
  onUpdateUnit,
}: {
  disabled: boolean;
  existingDates: Set<string>;
  onImport: (dailyPnls: Map<string, number>, dailyNotes?: Map<string, string>) => void;
  onUpdateUnit?: (currency: string) => void;
}) => {
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file || disabled) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const isHtml = ext === 'htm' || ext === 'html';

    const finish = ({ dailyPnls, currency, dailyNotes }: ParseResult) => {
      if (dailyPnls.size === 0) {
        setMessage({ text: '取り込み対象が見つかりませんでした。', ok: false });
        return;
      }
      const overlapping = Array.from(dailyPnls.keys()).filter((d) => existingDates.has(d));
      if (overlapping.length > 0) {
        const proceed = window.confirm(
          `${overlapping.length}日分のデータが既に登録されています。上書きしますか？`,
        );
        if (!proceed) return;
      }
      onImport(dailyPnls, dailyNotes);
      if (currency) onUpdateUnit?.(currency);
      const suffix = currency ? `（${currency}口座として認識）` : '';
      setMessage({ text: `${dailyPnls.size}日分の損益を取り込みました${suffix}。`, ok: true });
      window.setTimeout(() => setMessage(null), 5000);
    };

    const reader = new FileReader();
    reader.onerror = () => setMessage({ text: 'ファイルを読み込めませんでした。', ok: false });

    if (isHtml) {
      reader.onload = () => finish(parseMt4Html(decodeHtmlBuffer(reader.result as ArrayBuffer)));
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = () => finish(parseTradeCsv(String(reader.result ?? '')));
      reader.readAsText(file);
    }
  };

  return (
    <>
      {showGuide && <ImportGuideModal onClose={() => setShowGuide(false)} />}
      <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold text-white">MT4 / MT5 取り込み</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              取引履歴の日時と損益を日別に合算し、選択中の口座カレンダーへ反映します。
            </p>
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="mt-0.5 text-xs text-slate-500 underline underline-offset-2 transition hover:text-cyan-300"
            >
              取り込み方法を確認 →
            </button>
          </div>
          <label
            className={`inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full px-4 text-sm font-bold ring-1 transition ${
              disabled
                ? 'cursor-not-allowed bg-white/[0.02] text-slate-600 ring-white/[0.06]'
                : 'bg-white/[0.04] text-cyan-100 ring-white/10 hover:bg-cyan-300/10'
            }`}
          >
            ファイルを選択
            <input
              type="file"
              accept=".csv,.txt,.htm,.html"
              disabled={disabled}
              className="hidden"
              onChange={(event) => {
                handleFile(event.target.files?.[0]);
                event.currentTarget.value = '';
              }}
            />
          </label>
        </div>
        {message && (
          <p className={`mt-3 text-xs leading-5 ${message.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
            {message.text}
          </p>
        )}
      </div>
    </>
  );
};

// ── Stats bar ────────────────────────────────────────────────────────────────

const StatsBar = ({ stats, unit }: { stats: MonthStats; unit: string }) => {
  const totalColor =
    stats.total === 0
      ? 'text-slate-500'
      : stats.total > 0
        ? 'text-emerald-300'
        : 'text-rose-300';

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <p className="text-xs text-slate-500">月間合計</p>
        <p className={`mt-1 text-lg font-bold ${totalColor}`}>
          {stats.tradeDays === 0 ? '-' : formatUnit(stats.total, unit)}
        </p>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <p className="text-xs text-slate-500">勝率</p>
        <p className="mt-1 text-lg font-bold text-white">
          {stats.winRate !== null ? `${stats.winRate.toFixed(0)}%` : '-'}
        </p>
        {stats.tradeDays > 0 && (
          <p className="mt-0.5 text-xs text-slate-500">
            {stats.winDays}勝 {stats.lossDays}敗
          </p>
        )}
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <p className="text-xs text-slate-500">最高日</p>
        <p className="mt-1 text-lg font-bold text-emerald-300">
          {stats.best !== null && stats.best > 0 ? formatUnit(stats.best, unit) : '-'}
        </p>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <p className="text-xs text-slate-500">最大損失日</p>
        <p className="mt-1 text-lg font-bold text-rose-300">
          {stats.worst !== null && stats.worst < 0 ? formatUnit(stats.worst, unit) : '-'}
        </p>
      </div>
    </div>
  );
};

// ── Keyboard-aware modal shell ────────────────────────────────────────────────

const DayCellModal = ({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) => {
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setKeyboardOffset(Math.max(0, window.innerHeight - (vv.offsetTop + vv.height)));
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className="fixed inset-x-0 z-[61] flex justify-center px-4 animate-slide-up transition-[bottom] duration-75 sm:inset-0 sm:items-center sm:p-4"
        style={{
          bottom: keyboardOffset,
          paddingBottom: keyboardOffset > 0 ? '1rem' : 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        {children}
      </div>
    </>
  );
};

// ── Day cell input form ───────────────────────────────────────────────────────

const DayCellForm = ({
  date,
  existing,
  unit,
  onSave,
  onDelete,
  onCancel,
}: {
  date: string;
  existing: DailyRecord | undefined;
  unit: string;
  onSave: (pnl: number, notes?: string) => void;
  onDelete: () => void;
  onCancel: () => void;
}) => {
  const [pnl, setPnl] = useState(existing ? String(existing.pnl) : '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(pnl);
    if (!Number.isFinite(value)) {
      setError('数値を入力してください');
      return;
    }
    onSave(value, notes.trim() || undefined);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-xl border border-white/20 bg-slate-900 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      <p className="mb-2 text-sm font-bold text-white">{date}</p>
      {error && <p className="mb-2 text-xs text-rose-300">{error}</p>}
      <div className="space-y-2">
        <div>
          <label className="block text-xs text-slate-400">損益（{unit}）</label>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            autoFocus
            value={pnl}
            onChange={(e) => setPnl(e.target.value)}
            placeholder="例: 3500 または -1200"
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-base text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400">メモ（任意）</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="相場環境、気づきなど"
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-base text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-cyan-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
        >
          保存
        </button>
        {existing && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-rose-400/20 px-4 text-sm font-bold text-rose-300 ring-1 ring-rose-400/30 transition hover:bg-rose-400/30"
          >
            削除
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-white/[0.04] px-4 text-sm font-bold text-slate-400 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          閉じる
        </button>
      </div>
    </form>
  );
};

// ── Calendar grid ────────────────────────────────────────────────────────────

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const CalendarGrid = ({
  year,
  month,
  records,
  unit,
  onSave,
  onDelete,
}: {
  year: number;
  month: number;
  records: DailyRecord[];
  unit: string;
  onSave: (date: string, pnl: number, notes?: string) => void;
  onDelete: (date: string) => void;
}) => {
  const [openDate, setOpenDate] = useState<string | null>(null);
  const cells = buildCalendarDays(year, month);
  const recordMap = new Map(records.map((r) => [r.date, r]));
  const pnlValues = records.map((r) => Math.abs(r.pnl));
  const maxAbs = pnlValues.length > 0 ? Math.max(...pnlValues) : 0;
  const today = toYMD(new Date());
  const openRecord = openDate ? recordMap.get(openDate) : undefined;

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-slate-500">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} />;
          }
          const ymd = toYMD(date);
          const record = recordMap.get(ymd);
          const isToday = ymd === today;
          const isOpen = openDate === ymd;
          const bg = record ? cellBg(record.pnl, maxAbs) : undefined;

          return (
            <button
              key={ymd}
              type="button"
              onClick={() => setOpenDate(isOpen ? null : ymd)}
              className={`w-full rounded-lg border p-1.5 text-left transition ${
                isToday
                  ? 'border-cyan-300/40'
                  : isOpen
                    ? 'border-white/30'
                    : 'border-white/10 hover:border-white/20'
              }`}
              style={bg ? { backgroundColor: bg } : undefined}
            >
              <span
                className={`block text-xs font-bold ${
                  isToday ? 'text-cyan-200' : 'text-slate-400'
                }`}
              >
                {date.getDate()}
              </span>
              {record && (
                <span
                  className={`mt-0.5 block truncate text-[10px] font-bold leading-tight ${
                    record.pnl > 0 ? 'text-emerald-200' : 'text-rose-200'
                  }`}
                >
                  {record.pnl > 0 ? '+' : ''}
                  {record.pnl.toLocaleString('ja-JP')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {openDate && (
        <DayCellModal onClose={() => setOpenDate(null)}>
          <DayCellForm
            date={openDate}
            existing={openRecord}
            unit={unit}
            onSave={(pnl, notes) => {
              onSave(openDate, pnl, notes);
              setOpenDate(null);
            }}
            onDelete={() => {
              onDelete(openDate);
              setOpenDate(null);
            }}
            onCancel={() => setOpenDate(null)}
          />
        </DayCellModal>
      )}
    </div>
  );
};

// ── Week grid ─────────────────────────────────────────────────────────────────

const WeekGrid = ({
  weekStart,
  records,
  unit,
  layout,
  onSave,
  onDelete,
}: {
  weekStart: Date;
  records: DailyRecord[];
  unit: string;
  layout: 'list' | 'grid';
  onSave: (date: string, pnl: number, notes?: string) => void;
  onDelete: (date: string) => void;
}) => {
  const [openDate, setOpenDate] = useState<string | null>(null);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const recordMap = new Map(records.map((r) => [r.date, r]));
  const pnlValues = records.map((r) => Math.abs(r.pnl));
  const maxAbs = pnlValues.length > 0 ? Math.max(...pnlValues) : 0;
  const today = toYMD(new Date());
  const openRecord = openDate ? recordMap.get(openDate) : undefined;
  const startMonth = weekStart.getMonth();

  const cellBase = (ymd: string, isOtherMonth: boolean, isOpen: boolean, isToday: boolean) =>
    `w-full rounded-lg border text-left transition ${
      isToday
        ? 'border-cyan-300/40'
        : isOpen
          ? 'border-white/30'
          : isOtherMonth
            ? 'border-white/[0.05] opacity-40'
            : 'border-white/10 hover:border-white/20'
    }`;

  return (
    <div>
      {layout === 'grid' && (
        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-slate-500">
              {d}
            </div>
          ))}
        </div>
      )}

      {layout === 'grid' ? (
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((date) => {
            const ymd = toYMD(date);
            const record = recordMap.get(ymd);
            const isToday = ymd === today;
            const isOpen = openDate === ymd;
            const isOtherMonth = date.getMonth() !== startMonth;
            const bg = record ? cellBg(record.pnl, maxAbs) : undefined;

            return (
              <button
                key={ymd}
                type="button"
                onClick={() => setOpenDate(isOpen ? null : ymd)}
                className={`min-h-20 p-2 ${cellBase(ymd, isOtherMonth, isOpen, isToday)}`}
                style={bg ? { backgroundColor: bg } : undefined}
              >
                {isOtherMonth && (
                  <span className="block text-[10px] text-slate-600">{date.getMonth() + 1}月</span>
                )}
                <span className={`block text-sm font-bold ${isToday ? 'text-cyan-200' : isOtherMonth ? 'text-slate-600' : 'text-slate-300'}`}>
                  {date.getDate()}
                </span>
                {record ? (
                  <>
                    <span className={`mt-1 block text-xs font-bold leading-tight ${record.pnl > 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
                      {record.pnl > 0 ? '+' : ''}{record.pnl.toLocaleString('ja-JP')}
                    </span>
                    {record.notes && (
                      <span className="mt-0.5 block truncate text-[10px] leading-tight text-slate-500">
                        {record.notes}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="mt-1 block text-[10px] text-slate-700">―</span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1.5">
          {days.map((date) => {
            const ymd = toYMD(date);
            const record = recordMap.get(ymd);
            const isToday = ymd === today;
            const isOpen = openDate === ymd;
            const isOtherMonth = date.getMonth() !== startMonth;
            const bg = record ? cellBg(record.pnl, maxAbs) : undefined;

            return (
              <button
                key={ymd}
                type="button"
                onClick={() => setOpenDate(isOpen ? null : ymd)}
                className={`flex items-center gap-3 px-3 py-2.5 ${cellBase(ymd, isOtherMonth, isOpen, isToday)}`}
                style={bg ? { backgroundColor: bg } : undefined}
              >
                <div className="w-9 shrink-0 text-center">
                  <span className={`block text-[11px] font-semibold ${isToday ? 'text-cyan-300' : 'text-slate-500'}`}>
                    {WEEKDAYS[date.getDay()]}
                  </span>
                  <span className={`block text-xl font-bold leading-tight ${isToday ? 'text-cyan-200' : isOtherMonth ? 'text-slate-600' : 'text-slate-200'}`}>
                    {date.getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  {record ? (
                    <>
                      <p className={`text-sm font-bold ${record.pnl > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {record.pnl > 0 ? '+' : ''}{record.pnl.toLocaleString('ja-JP')}{unit}
                      </p>
                      {record.notes && (
                        <p className="mt-0.5 truncate text-xs text-slate-500">{record.notes}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-700">―</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}


      {openDate && (
        <DayCellModal onClose={() => setOpenDate(null)}>
          <DayCellForm
            date={openDate}
            existing={openRecord}
            unit={unit}
            onSave={(pnl, notes) => {
              onSave(openDate, pnl, notes);
              setOpenDate(null);
            }}
            onDelete={() => {
              onDelete(openDate);
              setOpenDate(null);
            }}
            onCancel={() => setOpenDate(null)}
          />
        </DayCellModal>
      )}
    </div>
  );
};

// ── CSV export / Twitter share helpers ───────────────────────────────────────

const exportMonthCsv = (
  monthRecords: DailyRecord[],
  year: number,
  month: number,
  accountName: string,
  unit: string,
): void => {
  const rows = [['日付', `損益（${unit}）`, 'メモ']];
  const sorted = [...monthRecords].sort((a, b) => a.date.localeCompare(b.date));
  for (const r of sorted) rows.push([r.date, String(r.pnl), r.notes ?? '']);
  const csv = rows.map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pnl_${accountName}_${year}${String(month + 1).padStart(2, '0')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const buildTweetText = (
  stats: MonthStats,
  periodLabel: string,
  unit: string,
  accountName: string,
): string =>
  [
    `📊 ${periodLabel} 損益まとめ【${accountName}】`,
    `合計: ${stats.tradeDays === 0 ? '-' : formatUnit(stats.total, unit)}`,
    stats.winRate !== null ? `勝率${stats.winRate.toFixed(0)}%` : '',
    `(${stats.tradeDays}日間)`,
    '',
    '#FX #損益カレンダー #WMB',
  ]
    .filter(Boolean)
    .join('\n');

// ── Share card canvas generation ──────────────────────────────────────────────

const fillRR = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const truncate = (ctx: CanvasRenderingContext2D, text: string, maxW: number): string => {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
};

const drawMonthGrid = (
  ctx: CanvasRenderingContext2D,
  year: number,
  month: number,
  records: DailyRecord[],
  font: string,
) => {
  const cells = buildCalendarDays(year, month);
  const rMap = new Map(records.map((r) => [r.date, r]));
  const maxAbs = Math.max(0, ...records.map((r) => Math.abs(r.pnl)));
  const WD = ['日', '月', '火', '水', '木', '金', '土'];
  const RX = 608, RY = 78, CW = 72, CH = 70, GAP = 4;

  ctx.fillStyle = '#475569';
  ctx.font = `bold 12px ${font}`;
  ctx.textAlign = 'center';
  WD.forEach((d, i) => ctx.fillText(d, RX + i * (CW + GAP) + CW / 2, RY + 18));

  cells.forEach((date, idx) => {
    const col = idx % 7, row = Math.floor(idx / 7);
    const x = RX + col * (CW + GAP), y = RY + 28 + row * (CH + GAP);
    if (!date) {
      ctx.fillStyle = 'rgba(255,255,255,0.02)'; fillRR(ctx, x, y, CW, CH, 6); ctx.fill();
      return;
    }
    const ymd = toYMD(date);
    const rec = rMap.get(ymd);
    if (rec) {
      const op = Math.min(Math.abs(rec.pnl) / (maxAbs || 1), 1) * 0.65 + 0.15;
      const h = Math.round(op * 255).toString(16).padStart(2, '0');
      ctx.fillStyle = rec.pnl > 0 ? `#6ee7b7${h}` : `#fca5a5${h}`;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
    }
    fillRR(ctx, x, y, CW, CH, 6); ctx.fill();
    ctx.fillStyle = rec ? '#f1f5f9' : '#475569';
    ctx.font = `bold 15px ${font}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(date.getDate()), x + CW / 2, y + 20);
    if (rec) {
      ctx.fillStyle = rec.pnl > 0 ? '#a7f3d0' : '#fecaca';
      ctx.font = `10px ${font}`;
      const abs = Math.abs(rec.pnl);
      const abbr = (rec.pnl > 0 ? '+' : '') + (abs >= 10000 ? `${(rec.pnl / 10000).toFixed(0)}万` : rec.pnl.toLocaleString('ja-JP'));
      ctx.fillText(abbr, x + CW / 2, y + 40);
    }
  });
  ctx.textAlign = 'left';
};

const drawWeekBars = (
  ctx: CanvasRenderingContext2D,
  weekStart: Date,
  records: DailyRecord[],
  unit: string,
  font: string,
) => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  });
  const rMap = new Map(records.map((r) => [r.date, r]));
  const maxAbs = Math.max(1, ...records.map((r) => Math.abs(r.pnl)));
  const WD = ['日', '月', '火', '水', '木', '金', '土'];
  const RX = 600, RY = 72, ROW_H = 70, BAR_X = RX + 60, BAR_MAX = 460;
  const today = toYMD(new Date());

  days.forEach((date, i) => {
    const y = RY + i * ROW_H;
    const ymd = toYMD(date);
    const rec = rMap.get(ymd);
    const isToday = ymd === today;

    ctx.fillStyle = isToday ? 'rgba(103,232,249,0.07)' : (i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent');
    fillRR(ctx, RX - 4, y + 2, 548, ROW_H - 4, 8); ctx.fill();

    ctx.fillStyle = isToday ? '#67e8f9' : '#64748b';
    ctx.font = `bold 12px ${font}`;
    ctx.textAlign = 'center';
    ctx.fillText(WD[date.getDay()], RX + 22, y + 22);
    ctx.fillStyle = isToday ? '#a5f3fc' : '#cbd5e1';
    ctx.font = `bold 22px ${font}`;
    ctx.fillText(String(date.getDate()), RX + 22, y + 52);

    if (rec) {
      const bw = Math.max(4, (Math.abs(rec.pnl) / maxAbs) * BAR_MAX);
      ctx.fillStyle = rec.pnl > 0 ? 'rgba(110,231,183,0.25)' : 'rgba(252,165,165,0.25)';
      fillRR(ctx, BAR_X, y + 20, bw, 26, 4); ctx.fill();
      ctx.fillStyle = rec.pnl > 0 ? '#6ee7b7' : '#fca5a5';
      ctx.font = `bold 15px ${font}`;
      ctx.textAlign = 'left';
      ctx.fillText(`${rec.pnl > 0 ? '+' : ''}${rec.pnl.toLocaleString('ja-JP')}${unit}`, BAR_X + 8, y + 38);
      if (rec.notes) {
        ctx.fillStyle = '#475569';
        ctx.font = `12px ${font}`;
        ctx.fillText(truncate(ctx, rec.notes, BAR_MAX - 8), BAR_X + 8, y + 58);
      }
    } else {
      ctx.fillStyle = '#334155';
      ctx.font = `15px ${font}`;
      ctx.textAlign = 'left';
      ctx.fillText('―', BAR_X + 8, y + 38);
    }
  });
  ctx.textAlign = 'left';
};

type CardOpts = {
  stats: MonthStats;
  records: DailyRecord[];
  periodLabel: string;
  unit: string;
  accountName: string;
  viewMode: 'month' | 'week';
  year: number;
  month: number;
  weekStart?: Date;
};

const generatePnLCard = async (opts: CardOpts): Promise<Blob> => {
  const W = 1200, H = 630;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  await document.fonts.ready;

  const FONT = '"Noto Sans JP","Hiragino Sans",system-ui,sans-serif';

  // Background + gradient
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, 'rgba(6,182,212,0.06)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  // Left panel
  ctx.fillStyle = 'rgba(255,255,255,0.03)'; fillRR(ctx, 48, 48, 508, 534, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; fillRR(ctx, 48, 48, 508, 534, 16); ctx.stroke();

  // Right panel
  ctx.fillStyle = 'rgba(255,255,255,0.03)'; fillRR(ctx, 584, 48, 568, 534, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; fillRR(ctx, 584, 48, 568, 534, 16); ctx.stroke();

  // === LEFT side ===
  const LX = 80;
  ctx.fillStyle = '#67e8f9'; ctx.font = `bold 13px ${FONT}`;
  ctx.fillText('アニャニカル覗き部屋 — 損益カレンダー', LX, 92);

  ctx.fillStyle = '#f1f5f9'; ctx.font = `bold 26px ${FONT}`;
  ctx.fillText(truncate(ctx, opts.accountName, 440), LX, 138);

  ctx.fillStyle = '#64748b'; ctx.font = `18px ${FONT}`;
  ctx.fillText(opts.periodLabel, LX, 172);

  // Total PnL (auto-size)
  const { stats } = opts;
  const totalStr = stats.tradeDays === 0
    ? '記録なし'
    : `${stats.total > 0 ? '＋' : ''}${stats.total.toLocaleString('ja-JP')}${opts.unit}`;
  ctx.fillStyle = stats.total > 0 ? '#6ee7b7' : stats.total < 0 ? '#fca5a5' : '#94a3b8';
  let fs = 56;
  ctx.font = `bold ${fs}px ${FONT}`;
  while (ctx.measureText(totalStr).width > 440 && fs > 28) { fs -= 2; ctx.font = `bold ${fs}px ${FONT}`; }
  ctx.fillText(totalStr, LX, 252);

  ctx.fillStyle = '#475569'; ctx.font = `13px ${FONT}`;
  ctx.fillText('損益合計', LX, 272);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(LX, 290); ctx.lineTo(528, 290); ctx.stroke();

  // Stats
  const stat = (label: string, val: string, col: string, x: number, y: number) => {
    ctx.fillStyle = '#64748b'; ctx.font = `13px ${FONT}`; ctx.fillText(label, x, y);
    ctx.fillStyle = col; ctx.font = `bold 22px ${FONT}`; ctx.fillText(val, x, y + 28);
  };
  if (stats.tradeDays > 0) {
    stat('勝率', stats.winRate !== null ? `${stats.winRate.toFixed(0)}%` : '―', '#f1f5f9', LX, 325);
    stat('取引日数', `${stats.tradeDays}日`, '#f1f5f9', LX + 170, 325);
    stat('勝', `${stats.winDays}日`, '#6ee7b7', LX, 395);
    stat('負', `${stats.lossDays}日`, '#fca5a5', LX + 110, 395);
    if (stats.best !== null && stats.best > 0)
      stat('最高', `+${stats.best.toLocaleString('ja-JP')}`, '#6ee7b7', LX, 465);
    if (stats.worst !== null && stats.worst < 0)
      stat('最大損失', stats.worst.toLocaleString('ja-JP'), '#fca5a5', LX + 200, 465);
  }

  ctx.fillStyle = '#334155'; ctx.font = `13px ${FONT}`;
  ctx.fillText('#FX  #損益カレンダー  #WMB', LX, 558);

  // === RIGHT side ===
  if (opts.viewMode === 'month') {
    drawMonthGrid(ctx, opts.year, opts.month, opts.records, FONT);
  } else if (opts.weekStart) {
    drawWeekBars(ctx, opts.weekStart, opts.records, opts.unit, FONT);
  }

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  );
};

// ── Share modal ───────────────────────────────────────────────────────────────

type SharePhase =
  | { phase: 'options' }
  | { phase: 'generating' }
  | { phase: 'preview'; imageUrl: string; filename: string; file: File };

const ShareModal = ({
  sharePhase,
  xHref,
  onScreenshot,
  onTextOnly,
  onClose,
}: {
  sharePhase: SharePhase;
  xHref: string;
  onScreenshot: () => void;
  onTextOnly: () => void;
  onClose: () => void;
}) => (
  <>
    <div
      className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    />
    <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 animate-slide-up">
      <div
        className="w-full max-w-sm rounded-xl border border-white/10 bg-slate-900 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        {sharePhase.phase === 'options' && (
          <>
            <p className="mb-4 text-sm font-bold text-white">シェア方法を選択</p>
            <div className="space-y-2">
              <button
                onClick={onScreenshot}
                className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/5"
              >
                <span className="text-xl">🖼</span>
                <div>
                  <p className="text-sm font-bold text-white">スクショ付きでシェア</p>
                  <p className="mt-0.5 text-xs text-slate-500">カレンダー画像を生成してXに投稿</p>
                </div>
              </button>
              <button
                onClick={onTextOnly}
                className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <span className="text-xl">📝</span>
                <div>
                  <p className="text-sm font-bold text-white">テキストのみシェア</p>
                  <p className="mt-0.5 text-xs text-slate-500">テキストだけでXを開く</p>
                </div>
              </button>
            </div>
            <button
              onClick={onClose}
              className="mt-3 w-full rounded-full py-2 text-xs text-slate-600 transition hover:text-slate-400"
            >
              キャンセル
            </button>
          </>
        )}

        {sharePhase.phase === 'generating' && (
          <div className="flex flex-col items-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
            <p className="mt-4 text-sm text-slate-400">画像を生成中...</p>
          </div>
        )}

        {sharePhase.phase === 'preview' && (
          <>
            <p className="mb-3 text-sm font-bold text-white">シェア用画像</p>
            <img src={sharePhase.imageUrl} alt="PnL Card" className="w-full rounded-lg" />
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-500">①</span>
                <button
                  onClick={async () => {
                    const isTouchPrimary = navigator.maxTouchPoints > 1;
                    if (isTouchPrimary && navigator.canShare?.({ files: [sharePhase.file] })) {
                      try {
                        await navigator.share({ files: [sharePhase.file] });
                      } catch (e) {
                        if ((e as Error)?.name === 'AbortError') return;
                        // share failed — fall through to download
                        const link = document.createElement('a');
                        link.href = sharePhase.imageUrl;
                        link.download = sharePhase.filename;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    } else {
                      const link = document.createElement('a');
                      link.href = sharePhase.imageUrl;
                      link.download = sharePhase.filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-slate-700 px-4 text-sm font-bold text-white ring-1 ring-white/10 transition hover:bg-slate-600"
                >
                  ↓ 画像を保存
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-500">②</span>
                <a
                  href={xHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-slate-700 px-4 text-sm font-bold text-white ring-1 ring-white/10 transition hover:bg-slate-600"
                >
                  𝕏 でシェア
                </a>
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-3 w-full rounded-full py-2 text-xs text-slate-600 transition hover:text-slate-400"
            >
              閉じる
            </button>
          </>
        )}
      </div>
    </div>
  </>
);

// ── Main component ────────────────────────────────────────────────────────────

export const PnLCalendarTool = () => {
  const auth = useDiscordAuth();
  const {
    accounts,
    records,
    isLoading,
    error,
    addAccount,
    deleteAccount,
    updateAccount,
    setRecord,
    deleteRecord,
  } = usePnLCalendar();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPremiumUpsell, setShowPremiumUpsell] = useState(false);
  const [shareModal, setShareModal] = useState<SharePhase | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [weekLayout, setWeekLayout] = useState<'list' | 'grid'>('list');
  const [navDir, setNavDir] = useState<'left' | 'right' | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const canUseMultiAccount = auth.canAccessPremium;

  if (!auth.isAuthenticated) {
    if (!auth.isConfigured) return null;
    return <LoginGate onSignIn={() => auth.signIn('#/tools/trade-journal')} />;
  }
  if (isLoading)
    return <div className="py-12 text-center text-sm text-slate-400">読み込み中...</div>;
  if (error) return <div className="py-8 text-center text-sm text-rose-400">{error}</div>;

  const visibleAccounts = canUseMultiAccount ? accounts : accounts.slice(0, 1);
  const canAddAccount = canUseMultiAccount || accounts.length === 0;

  const effectiveAccountId =
    selectedAccountId &&
    (canUseMultiAccount
      ? selectedAccountId === '__all__' ||
        visibleAccounts.some((a) => a.id === selectedAccountId)
      : visibleAccounts.some((a) => a.id === selectedAccountId))
      ? selectedAccountId
      : (visibleAccounts[0]?.id ?? '');

  const selectedAccount = visibleAccounts.find((a) => a.id === effectiveAccountId);
  const isAllAccounts = canUseMultiAccount && effectiveAccountId === '__all__';

  const monthPrefix = `${String(year)}-${String(month + 1).padStart(2, '0')}-`;

  const accountRecords = records.filter((r) => r.accountId === effectiveAccountId);
  const existingDates = new Set(accountRecords.map((r) => r.date));

  const monthRecords: DailyRecord[] = isAllAccounts
    ? (() => {
        const byDate = new Map<string, number>();
        records
          .filter((r) => r.date.startsWith(monthPrefix))
          .forEach((r) => {
            byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.pnl);
          });
        return Array.from(byDate.entries()).map(([date, pnl]) => ({
          id: date,
          accountId: '__all__',
          date,
          pnl,
        }));
      })()
    : accountRecords.filter((r) => r.date.startsWith(monthPrefix));

  const stats = calcStats(monthRecords);
  const unit = isAllAccounts ? '' : (selectedAccount?.unit ?? '');

  // ── Weekly data ──
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return toYMD(d);
  });
  const weekDateSet = new Set(weekDates);
  const weekRecords: DailyRecord[] = isAllAccounts
    ? (() => {
        const byDate = new Map<string, number>();
        records
          .filter((r) => weekDateSet.has(r.date))
          .forEach((r) => { byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.pnl); });
        return Array.from(byDate.entries()).map(([date, pnl]) => ({
          id: date,
          accountId: '__all__',
          date,
          pnl,
        }));
      })()
    : accountRecords.filter((r) => weekDateSet.has(r.date));
  const weekStats = calcStats(weekRecords);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月${weekStart.getDate()}日〜${weekEnd.getDate()}日`
      : `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}/${weekStart.getDate()}〜${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;

  const prevMonth = () => {
    setNavDir('right');
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    setNavDir('left');
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };
  const prevWeek = () => {
    setNavDir('right');
    setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  };
  const nextWeek = () => {
    setNavDir('left');
    setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  };

  const switchToWeek = () => {
    setNavDir(null);
    const wEnd = new Date(weekStart);
    wEnd.setDate(wEnd.getDate() + 6);
    const mStart = new Date(year, month, 1);
    const mEnd = new Date(year, month + 1, 0);
    if (weekStart > mEnd || wEnd < mStart) {
      const snap = new Date(year, month, 1);
      snap.setDate(snap.getDate() - snap.getDay());
      snap.setHours(0, 0, 0, 0);
      setWeekStart(snap);
    }
    setViewMode('week');
  };
  const switchToMonth = () => {
    setNavDir(null);
    setYear(weekStart.getFullYear());
    setMonth(weekStart.getMonth());
    setViewMode('month');
  };

  const displayStats = viewMode === 'week' ? weekStats : stats;

  const periodLabel =
    viewMode === 'week' ? weekLabel : `${year}年${month + 1}月`;
  const tweetText = buildTweetText(displayStats, periodLabel, unit, selectedAccount?.name ?? '');
  const xHref = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(TRADE_JOURNAL_URL)}`;

  const handleShareScreenshot = async () => {
    setShareModal({ phase: 'generating' });
    try {
      const blob = await generatePnLCard({
        stats: displayStats,
        records: viewMode === 'week' ? weekRecords : monthRecords,
        periodLabel,
        unit,
        accountName: selectedAccount?.name ?? '',
        viewMode,
        year: viewMode === 'week' ? weekStart.getFullYear() : year,
        month: viewMode === 'week' ? weekStart.getMonth() : month,
        weekStart: viewMode === 'week' ? weekStart : undefined,
      });
      const safeName = (selectedAccount?.name ?? 'account').replace(/[^\w぀-ヿ一-鿿]/g, '_');
      const filename = `pnl_${safeName}_${periodLabel.replace(/[年月 \/〜]/g, '')}.png`;
      const file = new File([blob], filename, { type: 'image/png' });
      const imageUrl = URL.createObjectURL(blob);
      setShareModal({ phase: 'preview', imageUrl, filename, file });
    } catch (e) {
      console.error(e);
      setShareModal(null);
    }
  };

  if (accounts.length === 0) {
    return (
      <div>
        {!auth.canAccessPremium && (
          <div className="mb-4 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-50/80">
            Discordログインのみで1口座まで利用できます。複数口座管理はプレミアムで解放されます。
          </div>
        )}
        {showAddForm ? (
          <AccountForm
            mode="add"
            onSubmit={(name, u) => { addAccount(name, u); setShowAddForm(false); }}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-sm text-slate-400">口座がまだ登録されていません。</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-cyan-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              ＋ 口座を追加する
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {!canUseMultiAccount && (
        <div className="mb-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50/80">
          Discordログインのみの場合は1口座まで利用できます。複数口座・全口座合計はプレミアム限定です。
        </div>
      )}

      <AccountTabs
        accounts={visibleAccounts}
        selectedId={effectiveAccountId}
        onSelect={(id) => {
          setSelectedAccountId(id);
          setShowAddForm(false);
          setShowEditForm(false);
        }}
        onAddClick={() => {
          if (!canAddAccount) { setShowPremiumUpsell(true); return; }
          setShowEditForm(false);
          setShowAddForm((v) => !v);
        }}
        canUseMultiAccount={canUseMultiAccount}
      />

      {showAddForm && (
        <AccountForm
          mode="add"
          onSubmit={(name, u) => { addAccount(name, u); setShowAddForm(false); }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {!isAllAccounts && selectedAccount && (
        <>
          {showEditForm ? (
            <AccountForm
              mode="edit"
              initialName={selectedAccount.name}
              initialUnit={selectedAccount.unit}
              onSubmit={(name, u) => {
                updateAccount(selectedAccount.id, { name, unit: u });
                setShowEditForm(false);
              }}
              onCancel={() => setShowEditForm(false)}
            />
          ) : (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <p className="text-xs text-slate-500">
                  単位: <span className="text-slate-300">{selectedAccount.unit}</span>
                </p>
                <button
                  onClick={() => { setShowAddForm(false); setShowEditForm(true); }}
                  className="text-xs text-slate-500 transition hover:text-cyan-300"
                >
                  口座を編集
                </button>
              </div>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `「${selectedAccount.name}」を削除しますか？この口座の記録もすべて削除されます。`,
                    )
                  ) {
                    deleteAccount(selectedAccount.id);
                    setSelectedAccountId('');
                  }
                }}
                className="text-xs text-slate-600 transition hover:text-rose-400"
              >
                口座を削除
              </button>
            </div>
          )}
        </>
      )}

      <CsvImportPanel
        disabled={isAllAccounts || !effectiveAccountId}
        existingDates={existingDates}
        onUpdateUnit={(currency) => updateAccount(effectiveAccountId, { unit: currency })}
        onImport={(dailyPnls, dailyNotes) => {
          const firstDate = Array.from(dailyPnls.keys()).sort()[0];
          dailyPnls.forEach((pnl, date) => {
            const note = dailyNotes ? (dailyNotes.get(date) || undefined) : 'MT4/MT5 取り込み';
            setRecord(effectiveAccountId, date, pnl, note);
          });
          if (firstDate) {
            const [nextYear, nextMonth] = firstDate.split('-').map(Number);
            if (Number.isFinite(nextYear) && Number.isFinite(nextMonth)) {
              setYear(nextYear);
              setMonth(nextMonth - 1);
            }
          }
        }}
      />

      <StatsBar stats={displayStats} unit={unit} />

      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            onClick={viewMode === 'week' ? prevWeek : prevMonth}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.04] text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
          >
            ←
          </button>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <p className="text-sm font-bold text-white">
              {viewMode === 'week' ? weekLabel : `${year}年${month + 1}月`}
            </p>
            <div className="flex items-center gap-1.5">
              <div className="flex rounded-full bg-white/[0.04] p-0.5 ring-1 ring-white/10">
                <button
                  onClick={switchToMonth}
                  className={`rounded-full px-3 py-0.5 text-xs font-bold transition ${
                    viewMode === 'month'
                      ? 'bg-cyan-300 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  月
                </button>
                <button
                  onClick={switchToWeek}
                  className={`rounded-full px-3 py-0.5 text-xs font-bold transition ${
                    viewMode === 'week'
                      ? 'bg-cyan-300 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  週
                </button>
              </div>
              {viewMode === 'week' && (
                <div className="flex rounded-full bg-white/[0.04] p-0.5 ring-1 ring-white/10">
                  <button
                    onClick={() => setWeekLayout('list')}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold transition ${
                      weekLayout === 'list'
                        ? 'bg-cyan-300 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    縦
                  </button>
                  <button
                    onClick={() => setWeekLayout('grid')}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold transition ${
                      weekLayout === 'grid'
                        ? 'bg-cyan-300 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    横
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {!isAllAccounts && (viewMode === 'week' ? weekRecords : monthRecords).length > 0 && (
              <>
                <button
                  onClick={() => setShareModal({ phase: 'options' })}
                  title="X (Twitter) でシェア"
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  <span>𝕏</span> シェア
                </button>
                {/* Download dropdown */}
                <div className="relative">
                  {showDownloadMenu && (
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDownloadMenu(false)}
                    />
                  )}
                  <button
                    onClick={() => setShowDownloadMenu((v) => !v)}
                    title="ダウンロード"
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
                  >
                    <span>↓</span> ダウンロード
                  </button>
                  {showDownloadMenu && (
                    <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-white/10 bg-slate-950/95 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDownloadMenu(false);
                          void handleShareScreenshot();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                      >
                        <span>📷</span> 画像
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDownloadMenu(false);
                          exportMonthCsv(
                            viewMode === 'week' ? weekRecords : monthRecords,
                            viewMode === 'week' ? weekStart.getFullYear() : year,
                            viewMode === 'week' ? weekStart.getMonth() : month,
                            selectedAccount?.name ?? 'account',
                            unit,
                          );
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                      >
                        <span>📊</span> CSV
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            <button
              onClick={viewMode === 'week' ? nextWeek : nextMonth}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.04] text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
            >
              →
            </button>
          </div>
        </div>

        <div
          key={
            viewMode === 'week'
              ? `week-${weekLayout}-${weekStart.getTime()}`
              : `month-${year}-${month}`
          }
          className={
            navDir === 'left'
              ? 'animate-slide-in-right'
              : navDir === 'right'
                ? 'animate-slide-in-left'
                : 'animate-fade-in'
          }
        >
          {viewMode === 'week' ? (
            isAllAccounts ? (
              <WeekGrid weekStart={weekStart} records={weekRecords} unit="" layout={weekLayout} onSave={() => {}} onDelete={() => {}} />
            ) : (
              <WeekGrid
                weekStart={weekStart}
                records={weekRecords}
                unit={unit}
                layout={weekLayout}
                onSave={(date, pnl, notes) => setRecord(effectiveAccountId, date, pnl, notes)}
                onDelete={(date) => deleteRecord(effectiveAccountId, date)}
              />
            )
          ) : isAllAccounts ? (
            <CalendarGrid
              year={year}
              month={month}
              records={monthRecords}
              unit=""
              onSave={() => {}}
              onDelete={() => {}}
            />
          ) : (
            <CalendarGrid
              year={year}
              month={month}
              records={monthRecords}
              unit={unit}
              onSave={(date, pnl, notes) => setRecord(effectiveAccountId, date, pnl, notes)}
              onDelete={(date) => deleteRecord(effectiveAccountId, date)}
            />
          )}
        </div>

        {isAllAccounts && (
          <p className="mt-3 text-center text-xs text-slate-600">
            全口座合計表示では入力できません。各口座タブで入力してください。
          </p>
        )}
      </div>

      {showPremiumUpsell && (
        <PremiumUpsellModal onClose={() => setShowPremiumUpsell(false)} />
      )}

      {shareModal && (
        <ShareModal
          sharePhase={shareModal}
          xHref={xHref}
          onScreenshot={handleShareScreenshot}
          onTextOnly={() => {
            window.open(xHref, '_blank');
            setShareModal(null);
          }}
          onClose={() => {
            if (shareModal.phase === 'preview') URL.revokeObjectURL(shareModal.imageUrl);
            setShareModal(null);
          }}
        />
      )}
    </div>
  );
};
