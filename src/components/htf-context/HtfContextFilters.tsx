import {
  HTF_CONTEXT_CATEGORIES,
  HTF_CONTEXT_TIMEFRAMES,
} from '../../config/htfContextSymbols';
import {
  ALL_CATEGORIES,
  ALL_REVERSAL,
  ALL_STATES,
  ALL_TIMEFRAMES,
  REVERSAL_FILTER_OPTIONS,
  STATE_FILTER_OPTIONS,
  STATE_SHORTCUT_DOWN,
  STATE_SHORTCUT_RANGE,
  STATE_SHORTCUT_TREND,
  STATE_SHORTCUT_UP,
  TIMEFRAME_SHORTCUT_HIGHER,
  TIMEFRAME_SHORTCUT_SHORT_TERM,
  type HtfSearchFilters,
} from '../../utils/htfContextFilters';

type FilterPillProps = {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
};

// checkboxはsr-onlyで隠し、ラベル側の見た目をピル状にする。has-[:focus-visible]でキーボード
// フォーカス時のリングを出す（隠したcheckbox自体にフォーカスリングを出しても見えないため）。
const FilterPill = ({ checked, onChange, children }: FilterPillProps) => (
  <label
    className={`inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cyan-300 ${
      checked
        ? 'bg-cyan-300 text-slate-950 ring-cyan-300'
        : 'bg-white/[0.04] text-slate-400 ring-white/10 hover:bg-white/10'
    }`}
  >
    <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
    {children}
  </label>
);

const ShortcutButton = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex min-h-7 items-center justify-center rounded-full bg-white/[0.03] px-2.5 text-[11px] font-semibold text-slate-500 ring-1 ring-white/5 transition hover:bg-white/10 hover:text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
  >
    {children}
  </button>
);

type FilterGroupProps<T> = {
  title: string;
  values: T[];
  onSetValues: (next: T[]) => void;
  allValues: T[];
  shortcuts?: { label: string; values: T[] }[];
};

const FilterGroupHeader = <T,>({
  title,
  values,
  onSetValues,
  allValues,
  shortcuts,
}: FilterGroupProps<T>) => (
  <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="text-xs font-bold text-slate-500">
      {title}
      <span className="ml-1.5 font-normal text-slate-600">
        ({values.length}/{allValues.length})
      </span>
    </p>
    <div className="flex flex-wrap items-center gap-1.5">
      {shortcuts?.map((s) => (
        <ShortcutButton key={s.label} onClick={() => onSetValues(s.values)}>
          {s.label}
        </ShortcutButton>
      ))}
      <ShortcutButton onClick={() => onSetValues(allValues)}>すべて選択</ShortcutButton>
      <ShortcutButton onClick={() => onSetValues([])}>すべて解除</ShortcutButton>
    </div>
  </div>
);

export const HtfContextFilters = ({
  filters,
  onChange,
}: {
  filters: HtfSearchFilters;
  onChange: (next: HtfSearchFilters) => void;
}) => {
  const toggleState = (value: number) => {
    const next = filters.states.includes(value)
      ? filters.states.filter((v) => v !== value)
      : [...filters.states, value];
    onChange({ ...filters, states: next });
  };
  const toggleReversal = (value: 'warning' | 'none') => {
    const next = filters.reversal.includes(value)
      ? filters.reversal.filter((v) => v !== value)
      : [...filters.reversal, value];
    onChange({ ...filters, reversal: next });
  };
  const toggleTimeframe = (value: (typeof ALL_TIMEFRAMES)[number]) => {
    const next = filters.timeframes.includes(value)
      ? filters.timeframes.filter((v) => v !== value)
      : [...filters.timeframes, value];
    onChange({ ...filters, timeframes: next });
  };
  const toggleCategory = (value: (typeof ALL_CATEGORIES)[number]) => {
    const next = filters.categories.includes(value)
      ? filters.categories.filter((v) => v !== value)
      : [...filters.categories, value];
    onChange({ ...filters, categories: next });
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div>
        <FilterGroupHeader
          title="目線"
          values={filters.states}
          onSetValues={(v) => onChange({ ...filters, states: v })}
          allValues={ALL_STATES}
          shortcuts={[
            { label: '上方向だけ', values: STATE_SHORTCUT_UP },
            { label: '下方向だけ', values: STATE_SHORTCUT_DOWN },
            { label: 'レンジだけ', values: STATE_SHORTCUT_RANGE },
            { label: 'トレンドだけ', values: STATE_SHORTCUT_TREND },
          ]}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {STATE_FILTER_OPTIONS.map((option) => (
            <FilterPill
              key={option.value}
              checked={filters.states.includes(option.value)}
              onChange={() => toggleState(option.value)}
            >
              {option.icon} {option.label}
            </FilterPill>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <FilterGroupHeader
          title="反転警戒"
          values={filters.reversal}
          onSetValues={(v) => onChange({ ...filters, reversal: v })}
          allValues={ALL_REVERSAL}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {REVERSAL_FILTER_OPTIONS.map((option) => (
            <FilterPill
              key={option.value}
              checked={filters.reversal.includes(option.value)}
              onChange={() => toggleReversal(option.value)}
            >
              {option.label}
            </FilterPill>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <FilterGroupHeader
          title="時間足"
          values={filters.timeframes}
          onSetValues={(v) => onChange({ ...filters, timeframes: v })}
          allValues={ALL_TIMEFRAMES}
          shortcuts={[
            { label: '上位足のみ', values: TIMEFRAME_SHORTCUT_HIGHER },
            { label: '短期確認', values: TIMEFRAME_SHORTCUT_SHORT_TERM },
          ]}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {HTF_CONTEXT_TIMEFRAMES.map((tf) => (
            <FilterPill
              key={tf.id}
              checked={filters.timeframes.includes(tf.id)}
              onChange={() => toggleTimeframe(tf.id)}
            >
              {tf.label}
            </FilterPill>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <FilterGroupHeader
          title="カテゴリ"
          values={filters.categories}
          onSetValues={(v) => onChange({ ...filters, categories: v })}
          allValues={ALL_CATEGORIES}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {HTF_CONTEXT_CATEGORIES.map((category) => (
            <FilterPill
              key={category.id}
              checked={filters.categories.includes(category.id)}
              onChange={() => toggleCategory(category.id)}
            >
              {category.label}
            </FilterPill>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-white/5 pt-4">
        <FilterPill
          checked={filters.favoriteOnly}
          onChange={() => onChange({ ...filters, favoriteOnly: !filters.favoriteOnly })}
        >
          ★ お気に入りのみ
        </FilterPill>
      </div>
    </div>
  );
};
