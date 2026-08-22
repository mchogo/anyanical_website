import { useEffect, useState } from 'react';

import { Dialog } from './Dialog';

// 「プレミアム限定コンテンツ」ロック案内モーダル。MemberEngagement.tsx内の
// MemberDashboard/DailyMissionToolにほぼ同一の実装が個別にあったため一本化。
export const PremiumLockedDialog = ({
  lockedTitle,
  onClose,
  isAuthenticated,
  onSignIn,
}: {
  /** 表示中のロック対象タイトル。nullなら閉じている状態。 */
  lockedTitle: string | null;
  onClose: () => void;
  isAuthenticated: boolean;
  onSignIn: () => void;
}) => {
  // 閉じるアニメーション中もタイトルを表示し続けるため、直近の非null値を
  // 保持する（lockedTitleがnullになった瞬間にDialog内の文言が消えるのを防ぐ）。
  const [lastTitle, setLastTitle] = useState(lockedTitle);
  useEffect(() => {
    if (lockedTitle !== null) setLastTitle(lockedTitle);
  }, [lockedTitle]);

  return (
    <Dialog
      open={lockedTitle !== null}
      onClose={onClose}
      title={`${lastTitle ?? ''} はプレミアム限定です`}
    >
      <p className="mt-1 text-sm font-semibold text-amber-100">Premium locked</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        先出し考察、ゴールドの節目、追加考察をDiscord限定チャンネルで確認できます。
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href="#/tools/participation"
          onClick={onClose}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-amber-200 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
        >
          プレミアム内容を見る
        </a>
        {!isAuthenticated && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onSignIn();
            }}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-indigo-400 px-4 text-sm font-bold text-white transition hover:bg-indigo-300"
          >
            Discordログイン
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-white/[0.04] px-4 text-sm font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          閉じる
        </button>
      </div>
    </Dialog>
  );
};
