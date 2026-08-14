import { useEffect, useState } from 'react';

type LatestEntry = { id: string; headline: string } | null;

export const MatomeHeadlineBar = () => {
  const [entry, setEntry] = useState<LatestEntry>(null);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('matome-headline-dismissed') === '1',
  );

  useEffect(() => {
    let cancelled = false;
    fetch('/api/matome/entries')
      .then((res) => (res.ok ? res.json() : []))
      .then((entries: Array<{ id: string; headline: string }>) => {
        if (!cancelled && Array.isArray(entries) && entries.length > 0) {
          setEntry({ id: entries[0].id, headline: entries[0].headline });
        }
      })
      .catch(() => {
        // 取得できなくてもバーを非表示にするだけで、他の表示には影響させない
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (dismissed || !entry) return null;

  return (
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
          onClick={() => {
            sessionStorage.setItem('matome-headline-dismissed', '1');
            setDismissed(true);
          }}
          className="ml-1 shrink-0 rounded-full p-1 text-slate-700 transition hover:bg-white/10 hover:text-slate-500"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
