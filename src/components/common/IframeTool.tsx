import { useRef } from 'react';

// トレードタロット/アニャニカル解説など、同一オリジンの静的ページを
// iframeで埋め込むツール向けの共通ラッパー。
//
// 埋め込み先(public/配下の静的ビルド)は別ツールチェーンの成果物のため、
// postMessageによる高さ同期は今回見送り、モバイルでは`heightClassName`で
// 高さをビューポート基準に抑えて内部スクロールに任せ、全画面表示ボタンと
// 新しいタブで開くボタンを逃げ道として用意する方式にしている。
export const IframeTool = ({
  src,
  title,
  heightClassName,
}: {
  src: string;
  title: string;
  heightClassName: string;
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const openFullscreen = () => {
    const el = iframeRef.current;
    if (!el?.requestFullscreen) return;
    void el.requestFullscreen().catch(() => {
      // Fullscreen APIが使えない環境では何もしない(新しいタブで開くボタンが代替導線)
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950">
      <div className="flex items-center justify-end gap-2 border-b border-white/10 bg-white/[0.02] px-3 py-2">
        <button
          type="button"
          onClick={openFullscreen}
          className="inline-flex min-h-8 items-center gap-1 rounded-full bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          ⤢ 全画面表示
        </button>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-8 items-center gap-1 rounded-full bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          新しいタブで開く ↗
        </a>
      </div>
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className={`w-full border-0 ${heightClassName}`}
        loading="lazy"
        allowFullScreen
      />
    </div>
  );
};
