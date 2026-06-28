import { useEffect, useState } from 'react';

import { useDiscordAuth } from '../hooks/useDiscordAuth';
import { usePnLCalendar, type Account, type DailyRecord } from '../hooks/usePnLCalendar';

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

type ParseResult = { dailyPnls: Map<string, number>; currency?: string };

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


const parseTradeCsv = (text: string): Map<string, number> => {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return new Map();

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
  ]);
  const profitIndex = findColumn(headers, ['profit', '損益']);
  const swapIndex = findColumn(headers, ['swap', 'スワップ']);
  const commissionIndex = findColumn(headers, ['commission', '手数料']);

  if (closeTimeIndex === -1 || profitIndex === -1) return new Map();

  const byDate = new Map<string, number>();
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line, delimiter);
    const date = parseTradeDate(cells[closeTimeIndex]);
    const profit = parseNumber(cells[profitIndex]);
    if (!date || profit === null) continue;
    const swap = parseNumber(cells[swapIndex]) ?? 0;
    const commission = parseNumber(cells[commissionIndex]) ?? 0;
    byDate.set(date, (byDate.get(date) ?? 0) + profit + swap + commission);
  }
  return byDate;
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
  onImport: (dailyPnls: Map<string, number>) => void;
  onUpdateUnit?: (currency: string) => void;
}) => {
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file || disabled) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const isHtml = ext === 'htm' || ext === 'html';

    const finish = ({ dailyPnls, currency }: ParseResult) => {
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
      onImport(dailyPnls);
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
      reader.onload = () => finish({ dailyPnls: parseTradeCsv(String(reader.result ?? '')) });
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
        <>
          <div
            className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpenDate(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[61] flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-slide-up sm:inset-0 sm:items-center">
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
          </div>
        </>
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

const shareOnX = (stats: MonthStats, year: number, month: number, unit: string, accountName: string): void => {
  const totalStr = stats.tradeDays === 0 ? '-' : formatUnit(stats.total, unit);
  const winRateStr = stats.winRate !== null ? `勝率${stats.winRate.toFixed(0)}%` : '';
  const text = [
    `📊 ${year}年${month + 1}月 損益まとめ【${accountName}】`,
    `合計: ${totalStr}`,
    winRateStr,
    `(${stats.tradeDays}日間)`,
    '',
    '#FX #損益カレンダー #WMB',
  ]
    .filter(Boolean)
    .join('\n');
  window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
};

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

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
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
        onImport={(dailyPnls) => {
          const firstDate = Array.from(dailyPnls.keys()).sort()[0];
          dailyPnls.forEach((pnl, date) => {
            setRecord(effectiveAccountId, date, pnl, 'MT4/MT5 取り込み');
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

      <StatsBar stats={stats} unit={unit} />

      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            onClick={prevMonth}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.04] text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
          >
            ←
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <p className="text-sm font-bold text-white">
              {year}年{month + 1}月
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {!isAllAccounts && monthRecords.length > 0 && (
              <>
                <button
                  onClick={() =>
                    shareOnX(stats, year, month, unit, selectedAccount?.name ?? '')
                  }
                  title="X (Twitter) でシェア"
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.04] text-xs text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  𝕏
                </button>
                <button
                  onClick={() =>
                    exportMonthCsv(monthRecords, year, month, selectedAccount?.name ?? 'account', unit)
                  }
                  title="CSVエクスポート"
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.04] text-xs text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  ↓
                </button>
              </>
            )}
            <button
              onClick={nextMonth}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.04] text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
            >
              →
            </button>
          </div>
        </div>

        {isAllAccounts ? (
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

        {isAllAccounts && (
          <p className="mt-3 text-center text-xs text-slate-600">
            全口座合計表示では入力できません。各口座タブで入力してください。
          </p>
        )}
      </div>

      {showPremiumUpsell && (
        <PremiumUpsellModal onClose={() => setShowPremiumUpsell(false)} />
      )}
    </div>
  );
};
