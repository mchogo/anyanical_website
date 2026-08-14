import { useEffect, useRef, useState } from 'react';

// X(Twitter)公式のembed widget。TradingView widget（ChartSection.tsx）と同じ
// 「コンテナへscriptをappendし、外部JSにDOMを描画させる」パターンに従う。
// widgets.jsはページ内で1回だけ読み込み、以降は twttr.widgets.load() で再スキャンする。

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: (element?: HTMLElement) => Promise<unknown[]>;
      };
    };
  }
}

const WIDGETS_SCRIPT_ID = 'twitter-widgets-js';
let widgetsPromise: Promise<void> | null = null;

const loadTwitterWidgets = (): Promise<void> => {
  if (window.twttr?.widgets) return Promise.resolve();
  if (widgetsPromise) return widgetsPromise;

  widgetsPromise = new Promise((resolve) => {
    const existing = document.getElementById(WIDGETS_SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.id = WIDGETS_SCRIPT_ID;
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
  return widgetsPromise;
};

// tweetの描画完了(twttr.widgets.loadの解決)まで表示する仮の枠。
// 実際の埋め込みとおおよそ同じ幅・構成にして、切り替わり時のガタつきを抑える。
const EmbedSkeleton = () => (
  <div className="mx-auto w-full max-w-[550px] animate-pulse rounded-xl border border-white/15 bg-white/[0.03] p-4">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 shrink-0 rounded-full bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/3 rounded bg-white/10" />
        <div className="h-2.5 w-1/4 rounded bg-white/[0.07]" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-3 w-full rounded bg-white/10" />
      <div className="h-3 w-5/6 rounded bg-white/10" />
      <div className="h-3 w-2/3 rounded bg-white/10" />
    </div>
    <div className="mt-4 h-40 w-full rounded-lg bg-white/[0.06]" />
  </div>
);

export const XPostEmbed = ({ url }: { url: string }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setLoaded(false);
    container.innerHTML = '';
    const blockquote = document.createElement('blockquote');
    blockquote.className = 'twitter-tweet';
    blockquote.setAttribute('data-theme', 'dark');
    blockquote.setAttribute('data-dnt', 'true');
    const link = document.createElement('a');
    link.href = url;
    blockquote.appendChild(link);
    container.appendChild(blockquote);

    let cancelled = false;
    const finish = () => {
      if (!cancelled) setLoaded(true);
    };

    void loadTwitterWidgets().then(() => {
      if (cancelled) return;
      const result = window.twttr?.widgets?.load(container);
      if (result && typeof result.then === 'function') {
        result.then(finish).catch(finish);
      } else {
        // widgets.jsのバージョン差でPromiseが返らない場合の保険。
        window.setTimeout(finish, 1500);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="relative grid w-full justify-items-center">
      <div
        className={`col-start-1 row-start-1 w-full transition-opacity duration-500 ${
          loaded ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <EmbedSkeleton />
      </div>
      <div
        ref={containerRef}
        className={`x-post-embed col-start-1 row-start-1 w-full transition-opacity duration-500 [&>div]:mx-auto ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
