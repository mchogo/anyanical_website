// お気に入りのサーバー保存(PUT /api/favorites)が失敗した時の共通表示。
// スクリーンリーダーには常にaria-liveで状態を伝え、失敗時のみ視覚的な
// 再試行ボタンを出す。
export const FavoriteSaveStatus = ({
  saveError,
  statusMessage,
  onRetry,
}: {
  saveError: boolean;
  statusMessage: string | null;
  onRetry: () => void;
}) => (
  <>
    <span className="sr-only" role="status" aria-live="polite">
      {statusMessage ?? ''}
    </span>
    {saveError && (
      <button
        type="button"
        onClick={onRetry}
        className="text-xs font-semibold text-rose-300 underline decoration-dotted underline-offset-2 transition hover:text-rose-200"
      >
        お気に入りの保存に失敗しました。再試行
      </button>
    )}
  </>
);
