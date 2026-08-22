import { useEffect, useRef, useState } from 'react';

// TradingView公式の埋め込みウィジェット(.tradingview-widget-container へ
// <script>を追加する既存パターン)を共通化したもの。ChartSection.tsx /
// RelatedTools.tsx にほぼ同一のscript注入ロジックが重複していたため一本化し、
// 読み込み中/失敗状態の表示をここに一箇所だけ実装する。
//
// TradingViewの埋め込みscriptはロード完了/失敗の公式コールバックを提供して
// いないため、以下の best-effort な組み合わせで状態を推定する:
// - <script>のonerror(ネットワーク遮断・404など明確な失敗)
// - ウィジェット用の子要素が挿入されたかのMutationObserver監視
// - 一定時間(WIDGET_TIMEOUT_MS)経過しても何も挿入されなければ失敗扱い
// 誤検知(低速回線を失敗と誤判定する等)はあり得るため、必ず再試行導線を出す。

type WidgetState = 'loading' | 'loaded' | 'failed';

const WIDGET_TIMEOUT_MS = 12000;

export type TradingViewWidgetProps = {
  src: string;
  config: Record<string, unknown>;
  heightClassName: string;
  className?: string;
  /** 失敗時に「外部で開く」導線として出すURL。省略時はボタンを出さない。 */
  fallbackUrl?: string;
  fallbackLabel?: string;
};

export const TradingViewWidget = ({
  src,
  config,
  heightClassName,
  className = 'overflow-hidden rounded-lg border border-white/10 bg-slate-950',
  fallbackUrl,
  fallbackLabel = 'TradingViewで開く',
}: TradingViewWidgetProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<WidgetState>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const configJson = JSON.stringify(config);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setState('loading');
    container.innerHTML =
      '<div class="tradingview-widget-container" style="height:100%;width:100%"><div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div></div>';

    let settled = false;
    const markLoaded = () => {
      if (settled) return;
      settled = true;
      setState('loaded');
    };
    const markFailed = () => {
      if (settled) return;
      settled = true;
      setState('failed');
    };

    const widgetHost = container.querySelector<HTMLElement>(
      '.tradingview-widget-container__widget',
    );
    const observer = new MutationObserver(() => {
      if ((widgetHost?.childElementCount ?? 0) > 0) markLoaded();
    });
    if (widgetHost) observer.observe(widgetHost, { childList: true, subtree: true });

    const script = document.createElement('script');
    script.src = src;
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = configJson;
    script.onerror = markFailed;
    container.querySelector('.tradingview-widget-container')?.appendChild(script);

    const timeoutId = window.setTimeout(markFailed, WIDGET_TIMEOUT_MS);

    return () => {
      settled = true; // アンマウント/再実行後の遅延コールバックでsetStateしない
      observer.disconnect();
      window.clearTimeout(timeoutId);
      container.innerHTML = '';
    };
  }, [src, configJson, retryKey]);

  return (
    <div className={`relative ${heightClassName}`}>
      <div
        ref={containerRef}
        aria-busy={state === 'loading'}
        className={`h-full w-full ${className}`}
      />
      {state === 'loading' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-cyan-300 motion-reduce:animate-none" />
        </div>
      )}
      {state === 'failed' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-slate-950/90 p-4 text-center backdrop-blur-sm">
          <p className="text-sm text-slate-300">
            チャートを読み込めませんでした。回線状況やブラウザの拡張機能(広告ブロック等)をご確認ください。
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="inline-flex min-h-9 items-center justify-center rounded-full bg-cyan-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              再試行
            </button>
            {fallbackUrl && (
              <a
                href={fallbackUrl}
                rel="noopener noreferrer"
                target="_blank"
                className="inline-flex min-h-9 items-center justify-center rounded-full bg-white/[0.06] px-4 text-sm font-bold text-slate-200 ring-1 ring-white/15 transition hover:bg-white/10"
              >
                {fallbackLabel}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
