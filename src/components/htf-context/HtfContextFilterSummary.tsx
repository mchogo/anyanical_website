import { summarizeFilters, type HtfSearchFilters } from '../../utils/htfContextFilters';

export type SaveStatus = 'applied' | 'saved' | 'unsaved' | 'saving' | 'sync-failed';

const SAVE_STATUS_META: Record<SaveStatus, { label: string; className: string }> = {
  applied: { label: '条件適用中', className: 'text-cyan-300' },
  saved: { label: '保存済み', className: 'text-emerald-300' },
  unsaved: { label: '未保存', className: 'text-amber-300' },
  saving: { label: '保存中…', className: 'text-slate-400' },
  'sync-failed': { label: '同期失敗', className: 'text-rose-300' },
};

// 検索パネルの中で使う「今の条件」の要約（例: 上目線・下目線 / D1・H4 / 反転警戒なし / クロス円・貴金属 / 12件）。
export const HtfContextFilterSummary = ({
  filters,
  matchCount,
  saveStatus,
}: {
  filters: HtfSearchFilters;
  matchCount: number;
  saveStatus: SaveStatus;
}) => {
  const meta = SAVE_STATUS_META[saveStatus];
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-slate-950/40 px-3.5 py-2.5 text-xs">
      <p className="text-slate-300">
        {summarizeFilters(filters)}
        <span className="ml-1.5 font-bold text-cyan-200">/ {matchCount}件</span>
      </p>
      <span className={`font-bold ${meta.className}`}>{meta.label}</span>
    </div>
  );
};

// 検索パネルが閉じている間も、上部の検索ボタン付近に出す簡易バッジ。
export const HtfContextFilterBadge = ({
  isDefault,
  matchCount,
  saveStatus,
}: {
  isDefault: boolean;
  matchCount: number;
  saveStatus: SaveStatus;
}) => {
  if (isDefault) return null;
  const meta = SAVE_STATUS_META[saveStatus];
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
      <span className="text-cyan-300">条件適用中</span>
      <span>{matchCount}件</span>
      <span className={meta.className}>・{meta.label}</span>
    </span>
  );
};
