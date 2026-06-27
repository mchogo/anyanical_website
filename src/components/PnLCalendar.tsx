import { useState } from 'react';

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

// ── Gate components ───────────────────────────────────────────────────────────

const LoginGate = ({ onSignIn }: { onSignIn: () => void }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.035] p-8 text-center">
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

const UpgradeGate = () => (
  <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-8 text-center">
    <p className="text-base font-bold text-amber-100">プレミアム限定機能</p>
    <p className="mt-2 text-sm leading-6 text-amber-100/80">
      損益カレンダーはプレミアム会員専用のツールです。noteメンバーシップに加入してロール付与を受けることでご利用いただけます。
    </p>
    <a
      href="#/tools/participation"
      className="mt-6 inline-flex min-h-10 items-center justify-center rounded-full bg-amber-200 px-5 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
    >
      プレミアムを確認する
    </a>
  </div>
);

// ── Account tab bar ───────────────────────────────────────────────────────────

const AccountTabs = ({
  accounts,
  selectedId,
  onSelect,
  onAddClick,
}: {
  accounts: Account[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAddClick: () => void;
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
    {accounts.length > 1 && (
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
      ＋ 口座追加
    </button>
  </div>
);

// ── Add account form ──────────────────────────────────────────────────────────

const UNIT_SUGGESTIONS = ['円', 'USD', 'pips', '%'];

const AddAccountForm = ({
  onAdd,
  onCancel,
}: {
  onAdd: (name: string, unit: string) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('円');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('口座名を入力してください');
      return;
    }
    if (!unit.trim()) {
      setError('単位を入力してください');
      return;
    }
    onAdd(name.trim(), unit.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-4"
    >
      <p className="mb-3 text-sm font-bold text-white">口座を追加</p>
      {error && <p className="mb-3 text-xs text-rose-300">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <div className="min-w-0 flex-1">
          <label className="block text-xs font-semibold text-slate-400">口座名</label>
          <input
            type="text"
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
          追加
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
      className="absolute left-0 top-full z-20 mt-1 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-white/20 bg-slate-900 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="mb-2 text-xs font-bold text-white">{date}</p>
      {error && <p className="mb-2 text-xs text-rose-300">{error}</p>}
      <div className="space-y-2">
        <div>
          <label className="block text-xs text-slate-400">損益（{unit}）</label>
          <input
            type="number"
            step="any"
            autoFocus
            value={pnl}
            onChange={(e) => setPnl(e.target.value)}
            placeholder="例: 3500 または -1200"
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400">メモ（任意）</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="相場環境、気づきなど"
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="inline-flex min-h-7 items-center justify-center rounded-full bg-cyan-300 px-3 text-xs font-bold text-slate-950 transition hover:bg-cyan-200"
        >
          保存
        </button>
        {existing && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex min-h-7 items-center justify-center rounded-full bg-rose-400/20 px-3 text-xs font-bold text-rose-300 ring-1 ring-rose-400/30 transition hover:bg-rose-400/30"
          >
            削除
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-7 items-center justify-center rounded-full bg-white/[0.04] px-3 text-xs font-bold text-slate-400 ring-1 ring-white/10 transition hover:bg-white/10"
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
            <div key={ymd} className="relative">
              <button
                type="button"
                onClick={() => setOpenDate(isOpen ? null : ymd)}
                className={`relative w-full rounded-lg border p-1.5 text-left transition ${
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
                    className={`mt-0.5 block text-[10px] font-bold leading-tight ${
                      record.pnl > 0 ? 'text-emerald-200' : 'text-rose-200'
                    }`}
                  >
                    {record.pnl > 0 ? '+' : ''}
                    {record.pnl.toLocaleString('ja-JP')}
                  </span>
                )}
              </button>

              {isOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpenDate(null)} />
                  <DayCellForm
                    date={ymd}
                    existing={record}
                    unit={unit}
                    onSave={(pnl, notes) => {
                      onSave(ymd, pnl, notes);
                      setOpenDate(null);
                    }}
                    onDelete={() => {
                      onDelete(ymd);
                      setOpenDate(null);
                    }}
                    onCancel={() => setOpenDate(null)}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
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
    setRecord,
    deleteRecord,
  } = usePnLCalendar();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!auth.isAuthenticated) {
    if (!auth.isConfigured) return null;
    return <LoginGate onSignIn={() => auth.signIn('#/tools/trade-journal')} />;
  }
  if (!auth.canAccessPremium) return <UpgradeGate />;
  if (isLoading)
    return <div className="py-12 text-center text-sm text-slate-400">読み込み中...</div>;
  if (error) return <div className="py-8 text-center text-sm text-rose-400">{error}</div>;

  const effectiveAccountId =
    selectedAccountId &&
    (selectedAccountId === '__all__' || accounts.some((a) => a.id === selectedAccountId))
      ? selectedAccountId
      : (accounts[0]?.id ?? '');

  const selectedAccount = accounts.find((a) => a.id === effectiveAccountId);
  const isAllAccounts = effectiveAccountId === '__all__';

  const monthPrefix = `${String(year)}-${String(month + 1).padStart(2, '0')}-`;

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
    : records.filter(
        (r) => r.accountId === effectiveAccountId && r.date.startsWith(monthPrefix),
      );

  const stats = calcStats(monthRecords);
  const unit = isAllAccounts ? '' : (selectedAccount?.unit ?? '');

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };

  if (accounts.length === 0) {
    return (
      <div>
        {showAddForm ? (
          <AddAccountForm
            onAdd={(name, u) => {
              addAccount(name, u);
              setShowAddForm(false);
            }}
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
      <AccountTabs
        accounts={accounts}
        selectedId={effectiveAccountId}
        onSelect={(id) => {
          setSelectedAccountId(id);
          setShowAddForm(false);
        }}
        onAddClick={() => setShowAddForm((v) => !v)}
      />

      {showAddForm && (
        <AddAccountForm
          onAdd={(name, u) => {
            addAccount(name, u);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {!isAllAccounts && selectedAccount && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            単位: <span className="text-slate-300">{selectedAccount.unit}</span>
          </p>
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

      <StatsBar stats={stats} unit={unit} />

      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.04] text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
          >
            ←
          </button>
          <p className="text-sm font-bold text-white">
            {year}年{month + 1}月
          </p>
          <button
            onClick={nextMonth}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.04] text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
          >
            →
          </button>
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
    </div>
  );
};
