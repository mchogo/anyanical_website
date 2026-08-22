import { useEffect, useState } from 'react';

// トップページ限定の告知セクション。あにゃAIセクションと同じ「バッジ+見出し+説明+CTA」の構成だが、
// スケールを落とし✕で閉じられるようにしたもの。閉じた状態はセッション単位で保持し、
// 右上のベル（FloatingNav）から他の告知バナーと一緒に再表示できる（BANNER_KEYSに登録が必要）。
export const HtfContextPromoBanner = () => {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('htf-context-promo-dismissed') === '1',
  );

  useEffect(() => {
    const handler = () => {
      sessionStorage.removeItem('htf-context-promo-dismissed');
      setDismissed(false);
    };
    window.addEventListener('banner:reset', handler);
    return () => window.removeEventListener('banner:reset', handler);
  }, []);

  if (dismissed) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <a
        href="#/tools/htf-context"
        className="group relative block overflow-hidden rounded-lg border border-amber-300/25 bg-gradient-to-r from-amber-300/10 via-slate-950 to-cyan-300/[0.06] px-5 py-4 transition hover:border-amber-300/40 sm:px-6"
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            sessionStorage.setItem('htf-context-promo-dismissed', '1');
            setDismissed(true);
            window.dispatchEvent(new Event('banner:dismissed'));
          }}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
          aria-label="お知らせを閉じる"
        >
          ✕
        </button>

        <div className="flex flex-wrap items-center gap-4 pr-8">
          <div className="min-w-[240px] flex-1">
            <span className="inline-flex rounded-full bg-amber-300 px-2.5 py-0.5 text-[10px] font-black text-slate-950">
              NEW
            </span>
            <h3 className="mt-2 text-lg font-black text-white sm:text-xl">
              📊 Anyanical Market Dashboard
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
              Anyanical
              ToolkitのAI環境認識（上目線/下目線/レンジ）を、銘柄横断でまとめて確認できます。プレミアム会員限定。
            </p>
          </div>
          <span className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-amber-300 px-5 text-sm font-black text-slate-950 transition group-hover:bg-amber-200">
            開いてみる →
          </span>
        </div>
      </a>
    </div>
  );
};
