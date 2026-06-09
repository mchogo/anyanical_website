import { useState } from 'react';

const FEATURES = [
  '★ 銘柄ピン留め — よく見る銘柄を★でお気に入り登録',
  '★ 価格クリックでクリップボードにコピー',
  '★ アラート6秒で自動消去 · プログレスバー付き',
  '★ EAチェックリストの状態を保存 · 次回も継続',
  '★ GapWatchテーブルを変動率でソート可能に',
  '★ 月曜オープンまでカウントダウン表示',
  '★ 銘柄名でリアルタイム検索フィルター',
  '★ Sparklineローディング中はシマーアニメーション',
  '★ チャートタブ切り替え時にスピナー表示',
  '★ アラートボタンに設定件数バッジ',
];

export const NewFeaturesTicker = () => {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('new-features-ticker-dismissed') === '1',
  );

  if (dismissed) return null;

  return (
    <div className="relative border-b border-cyan-300/10 bg-cyan-300/[0.03]">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-1.5 sm:px-6 lg:px-8">
        <span className="shrink-0 rounded bg-cyan-300/10 px-2 py-0.5 text-xs font-bold text-cyan-300 ring-1 ring-cyan-300/20">
          UPDATE
        </span>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            className="animate-marquee inline-flex gap-16 whitespace-nowrap"
            style={{ animationDuration: '44s' }}
          >
            {[...FEATURES, ...FEATURES].map((item, i) => (
              <span key={i} className="text-xs text-slate-500">
                {item}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem('new-features-ticker-dismissed', '1');
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
