import { Dialog } from './Dialog';

// お気に入り機能のプレミアム案内モーダル。以前は App.tsx / ToolPage.tsx /
// FloatingNav.tsx にそれぞれ独立した `fixed inset-0` 実装が存在していた
// (内容はほぼ同一)。共通Dialog基盤の上に一本化する。
export const FavoriteUpsellDialog = ({
  open,
  onClose,
  isAuthenticated,
}: {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
}) => (
  <Dialog open={open} onClose={onClose} title="お気に入りはプレミアム限定です">
    <p className="mt-1 text-sm font-semibold text-amber-100">Premium feature</p>
    <p className="mt-3 text-sm leading-6 text-slate-400">
      よく使うページを登録してナビバーからすぐアクセスできます。プレミアム会員向け機能です。
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
        <a
          href="#/login"
          onClick={onClose}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-indigo-400 px-4 text-sm font-bold text-white transition hover:bg-indigo-300"
        >
          Discordログイン
        </a>
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
