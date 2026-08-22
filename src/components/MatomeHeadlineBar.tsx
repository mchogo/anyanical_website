type LatestEntry = { id: string; headline: string };

// 表示可否の判定は src/hooks/useAnnouncementBanners.ts の useMatomeHeadlineBarState
// (AnnouncementBar.tsxが他の告知バナーとの優先順位付けに使う)。
export const MatomeHeadlineBar = ({
  entry,
  dismiss,
}: {
  entry: LatestEntry;
  dismiss: () => void;
}) => (
  <div className="border-b border-white/[0.07] bg-white/[0.015]">
    <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-1.5 sm:px-6 lg:px-8">
      <a href="#/matome" className="group flex min-w-0 flex-1 items-center gap-3">
        <span className="shrink-0 rounded bg-orange-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange-400 ring-1 ring-orange-300/20">
          SNS話題
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-slate-500 transition group-hover:text-slate-300">
          {entry.headline}
        </span>
        <span className="shrink-0 text-xs font-bold text-orange-300">続きを見る →</span>
      </a>

      <button
        type="button"
        onClick={dismiss}
        className="ml-1 shrink-0 rounded-full p-1 text-slate-700 transition hover:bg-white/10 hover:text-slate-500"
        aria-label="閉じる"
      >
        ✕
      </button>
    </div>
  </div>
);
