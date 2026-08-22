import type { HtfContextTimeframeId } from '../config/htfContextSymbols';
import type { HtfContextState } from '../hooks/useHtfContext';
import type { HtfSearchPreset } from '../hooks/useHtfContextSearchPresets';
import { getEmptyReason, type HtfSearchFilters } from '../utils/htfContextFilters';
import type { RecommendationItem } from '../utils/htfContextRecommendations';
import { HtfContextEmptyState } from './htf-context/HtfContextEmptyState';
import {
  HtfContextFilterSummary,
  type SaveStatus,
} from './htf-context/HtfContextFilterSummary';
import { HtfContextFilters } from './htf-context/HtfContextFilters';
import { HtfContextPresetManager } from './htf-context/HtfContextPresetManager';
import { HtfContextRecommendations } from './htf-context/HtfContextRecommendations';
import { HtfContextResultsDesktop } from './htf-context/HtfContextResultsDesktop';
import { HtfContextResultsMobile } from './htf-context/HtfContextResultsMobile';

type SearchResultItem = {
  symbol: string;
  timeframeId: HtfContextTimeframeId;
  row: HtfContextState;
};

// ダッシュボード本体（HtfContextBoard）に埋め込む「条件で検索」セクション。
// 別ページに分けていた時期もあったが、遷移が分かりにくいと判断しダッシュボードへ統合した。
// フィルター・プリセット・結果はすべて親から props で受け取り、このコンポーネント自身は
// APIコール・追加のデータ取得を行わない（単一の状態管理箇所を親に置くため）。
export const HtfContextSearchSection = ({
  id,
  filters,
  onFiltersChange,
  matchCount,
  saveStatus,
  hasAnyData,
  recommendations,
  results,
  favorites,
  onToggleFavorite,
  onSelect,
  onClose,
  animationClassName,
  onAnimationEnd,
  presets,
  selectedPresetId,
  isPresetMutating,
  presetStatusMessage,
  onApplyPresetId,
  onCreatePreset,
  onOverwritePreset,
  onRenamePreset,
  onDeletePreset,
  onSetDefaultPreset,
  onRefreshPresets,
  onResetFilters,
  onSelectAllTimeframes,
  onSelectAllStates,
  onSelectAllCategories,
  onSelectAllReversal,
  onClearFavoriteOnly,
}: {
  id?: string;
  filters: HtfSearchFilters;
  onFiltersChange: (next: HtfSearchFilters) => void;
  matchCount: number;
  saveStatus: SaveStatus;
  hasAnyData: boolean;
  recommendations: RecommendationItem[];
  results: SearchResultItem[];
  favorites: string[];
  onToggleFavorite: (symbol: string) => void;
  onSelect: (symbol: string, timeframeId: HtfContextTimeframeId) => void;
  onClose: () => void;
  animationClassName?: string;
  onAnimationEnd?: (e: React.AnimationEvent<HTMLDivElement>) => void;
  presets: HtfSearchPreset[];
  selectedPresetId: string | null;
  isPresetMutating: boolean;
  presetStatusMessage: string | null;
  onApplyPresetId: (id: string | null) => void;
  onCreatePreset: (name: string) => void;
  onOverwritePreset: () => void;
  onRenamePreset: (id: string, name: string) => void;
  onDeletePreset: (id: string) => void;
  onSetDefaultPreset: (id: string) => void;
  onRefreshPresets: () => void;
  onResetFilters: () => void;
  onSelectAllTimeframes: () => void;
  onSelectAllStates: () => void;
  onSelectAllCategories: () => void;
  onSelectAllReversal: () => void;
  onClearFavoriteOnly: () => void;
}) => {
  const emptyReason = results.length === 0 ? getEmptyReason(filters, hasAnyData) : null;

  return (
    <div
      id={id}
      className={`${animationClassName ?? ''} motion-reduce:animate-none mt-4 rounded-lg border border-cyan-300/20 bg-slate-950/60 p-4`}
      onAnimationEnd={onAnimationEnd}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-white">🔍 条件で検索</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="検索を閉じる"
          className="rounded-full p-2 text-slate-500 transition hover:bg-white/10 hover:text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
        >
          ✕
        </button>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        目線・反転警戒・時間足・カテゴリで全銘柄×全時間足を横断検索します。条件はDiscordアカウントに保存でき、他の端末でも共有されます。
      </p>

      <div className="mt-4">
        <HtfContextPresetManager
          presets={presets}
          selectedPresetId={selectedPresetId}
          isMutating={isPresetMutating}
          statusMessage={presetStatusMessage}
          onApplyPresetId={onApplyPresetId}
          onCreatePreset={onCreatePreset}
          onOverwritePreset={onOverwritePreset}
          onRenamePreset={onRenamePreset}
          onDeletePreset={onDeletePreset}
          onSetDefaultPreset={onSetDefaultPreset}
          onRefresh={onRefreshPresets}
          onResetFilters={onResetFilters}
        />
      </div>

      <div className="mt-4">
        <HtfContextFilters filters={filters} onChange={onFiltersChange} />
      </div>

      <div className="mt-4">
        <HtfContextFilterSummary
          filters={filters}
          matchCount={matchCount}
          saveStatus={saveStatus}
        />
      </div>

      {recommendations.length > 0 && (
        <div className="mt-4">
          <HtfContextRecommendations items={recommendations} onSelect={onSelect} />
        </div>
      )}

      <div className="mt-4">
        {emptyReason ? (
          <div className="rounded-lg border border-white/10 bg-slate-950/40">
            <HtfContextEmptyState
              reason={emptyReason}
              actions={[
                ...(emptyReason === 'no-timeframes'
                  ? [{ label: '時間足をすべて選択', onClick: onSelectAllTimeframes }]
                  : []),
                ...(emptyReason === 'no-states'
                  ? [{ label: '目線をすべて選択', onClick: onSelectAllStates }]
                  : []),
                ...(emptyReason === 'no-categories'
                  ? [{ label: 'カテゴリをすべて選択', onClick: onSelectAllCategories }]
                  : []),
                ...(emptyReason === 'no-reversal'
                  ? [{ label: '反転警戒条件をすべて選択', onClick: onSelectAllReversal }]
                  : []),
                ...(emptyReason === 'no-favorites' && filters.favoriteOnly
                  ? [{ label: 'お気に入り条件を解除', onClick: onClearFavoriteOnly }]
                  : []),
                ...(emptyReason === 'no-match' || emptyReason === 'no-data'
                  ? [{ label: '条件をリセット', onClick: onResetFilters }]
                  : []),
              ]}
            />
          </div>
        ) : (
          <>
            <HtfContextResultsDesktop
              results={results}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelect}
            />
            <HtfContextResultsMobile
              results={results}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelect}
            />
          </>
        )}
      </div>
    </div>
  );
};
