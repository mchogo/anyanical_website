import type { HtfSearchEmptyReason } from '../../utils/htfContextFilters';

export type EmptyStateAction = {
  label: string;
  onClick: () => void;
};

const EMPTY_REASON_TEXT: Record<HtfSearchEmptyReason, string> = {
  'no-timeframes': '時間足が選択されていません。',
  'no-states': '目線が選択されていません。',
  'no-categories': 'カテゴリが選択されていません。',
  'no-reversal': '反転警戒条件が選択されていません。',
  'no-favorites': 'お気に入りがありません。',
  'no-match': '現在の組み合わせに一致するデータがありません。',
  'no-data': 'まだHTFデータを受信していません。',
};

export const HtfContextEmptyState = ({
  reason,
  actions,
}: {
  reason: HtfSearchEmptyReason;
  actions?: EmptyStateAction[];
}) => (
  <div className="px-3 py-8 text-center text-sm text-slate-500">
    <p>{EMPTY_REASON_TEXT[reason]}</p>
    {actions && actions.length > 0 && (
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="inline-flex min-h-8 items-center justify-center rounded-full bg-white/[0.06] px-3.5 text-xs font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            {action.label}
          </button>
        ))}
      </div>
    )}
  </div>
);
