import { useEffect, useState } from 'react';

const ANNOUNCEMENTS = [
  '半裁量EA 配布受付中',
  'Discordメンバー向けに認証申請を受付中',
  'サブスク枠は残りわずか',
  '利用条件とリスク設定を確認してから申請してください',
  '導入前に口座条件・ロット目安・稼働前チェックを確認',
  '参加方法と導入手順はツールページから確認できます',
];

const SEPARATOR = '　·　';

export const NewFeaturesTicker = () => {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('announce-banner-dismissed') === '1',
  );

  useEffect(() => {
    const handler = () => {
      sessionStorage.removeItem('announce-banner-dismissed');
      setDismissed(false);
    };
    window.addEventListener('banner:reset', handler);
    return () => window.removeEventListener('banner:reset', handler);
  }, []);

  if (dismissed) return null;

  return (
    <div className="border-b border-white/[0.07] bg-white/[0.015]">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-1.5 sm:px-6 lg:px-8">
        <span className="shrink-0 rounded bg-cyan-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400 ring-1 ring-cyan-300/20">
          LIVE
        </span>

        <div className="min-w-0 flex-1 overflow-hidden motion-reduce:overflow-auto">
          <div className="animate-marquee motion-reduce:animate-none inline-flex gap-0 whitespace-nowrap">
            {[...ANNOUNCEMENTS, ...ANNOUNCEMENTS].map((item, i) => (
              <span key={i} className="text-xs text-slate-500">
                {item}
                {SEPARATOR}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem('announce-banner-dismissed', '1');
            setDismissed(true);
            window.dispatchEvent(new Event('banner:dismissed'));
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
