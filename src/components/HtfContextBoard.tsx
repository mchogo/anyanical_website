import { useEffect, useMemo, useRef, useState } from 'react';

import { useDiscordAuth } from '../hooks/useDiscordAuth';
import { useHtfContext, type HtfContextState } from '../hooks/useHtfContext';
import { useHtfContextFavorites } from '../hooks/useHtfContextFavorites';
import { useHtfContextSearchPresets } from '../hooks/useHtfContextSearchPresets';
import { useHtfContextUrlState } from '../hooks/useHtfContextUrlState';
import {
  HTF_CONTEXT_CATEGORIES,
  HTF_CONTEXT_DIGEST_PRIORITY,
  HTF_CONTEXT_TIMEFRAMES,
  getCategoryForSymbol,
  type HtfContextCategory,
  type HtfContextCategoryId,
  type HtfContextTimeframeId,
} from '../config/htfContextSymbols';
import { PremiumLockMark } from './MemberEngagement';
import { HtfContextSearchSection } from './HtfContextSearchSection';
import { HtfContextDetailBar } from './htf-context/HtfContextDetailBar';
import { HtfContextEmptyState } from './htf-context/HtfContextEmptyState';
import { HtfContextFilterBadge } from './htf-context/HtfContextFilterSummary';
import type { SaveStatus } from './htf-context/HtfContextFilterSummary';
import { HtfContextResultsDesktop } from './htf-context/HtfContextResultsDesktop';
import { HtfContextResultsMobile } from './htf-context/HtfContextResultsMobile';
import {
  formatBarDate,
  formatPrice,
  formatSymbolLabel,
  formatUpdatedAt,
  getStateMeta,
  isLowerActive,
  isUpperActive,
} from '../utils/htfContextFormat';
import {
  ALL_CATEGORIES,
  ALL_REVERSAL,
  ALL_STATES,
  ALL_TIMEFRAMES,
  DEFAULT_FILTERS,
  computeSearchResults,
  filtersEqual,
  type HtfSearchFilters,
} from '../utils/htfContextFilters';
import { computeRecommendations } from '../utils/htfContextRecommendations';

const ANYANICAL_TOOLKIT_URL = 'https://jp.tradingview.com/script/BV4TkZHZ/';
const SEARCH_PANEL_ID = 'htf-context-search-panel';

const HtfContextSymbolCard = ({
  symbol,
  row,
  isSelected,
  onSelect,
}: {
  symbol: string;
  row: HtfContextState | undefined;
  isSelected: boolean;
  onSelect: (symbol: string) => void;
}) => {
  const ringClass = isSelected
    ? 'border-cyan-300/60 ring-1 ring-cyan-300/40'
    : 'border-white/10 hover:border-white/20';

  if (!row) {
    return (
      <button
        type="button"
        onClick={() => onSelect(symbol)}
        className={`rounded-lg border bg-slate-950/40 p-5 text-left transition ${ringClass}`}
      >
        <p className="text-sm font-bold text-white">{formatSymbolLabel(symbol)}</p>
        <p className="mt-3 text-sm text-slate-500">
          データ待ち（データ受信をお待ちください）
        </p>
      </button>
    );
  }

  const meta = getStateMeta(row.state);
  const showReversalWarning =
    row.reversalWarning && (row.state === 2 || row.state === -2);
  const upperActive = isUpperActive(row.state);
  const lowerActive = isLowerActive(row.state);

  return (
    <button
      type="button"
      onClick={() => onSelect(symbol)}
      className={`rounded-lg border bg-slate-950/40 p-5 text-left transition ${ringClass}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-white">{formatSymbolLabel(symbol)}</p>
        <span className="text-2xl leading-none" aria-hidden="true">
          {meta.icon}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${meta.badgeClass}`}
        >
          {meta.label}
        </span>
        {showReversalWarning && (
          <span className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-0.5 text-xs font-bold text-amber-200">
            ⚠️反転警戒
          </span>
        )}
      </div>
      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between gap-2">
          <dt
            className={upperActive ? 'font-semibold text-emerald-300' : 'text-slate-500'}
          >
            🎯上ターゲット
          </dt>
          <dd
            className={`font-mono ${upperActive ? 'text-emerald-200' : 'text-slate-400'}`}
          >
            {formatPrice(symbol, row.refHigh)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className={lowerActive ? 'font-semibold text-rose-300' : 'text-slate-500'}>
            🎯下ターゲット
          </dt>
          <dd className={`font-mono ${lowerActive ? 'text-rose-200' : 'text-slate-400'}`}>
            {formatPrice(symbol, row.refLow)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-slate-600">確定足: {formatBarDate(row.barTime)}</p>
    </button>
  );
};

const AnyanicalToolkitLink = ({ className = '' }: { className?: string }) => (
  <a
    href={ANYANICAL_TOOLKIT_URL}
    target="_blank"
    rel="noopener noreferrer"
    className={`inline-flex items-center gap-1 break-words text-sm font-semibold text-cyan-300 hover:text-cyan-200 ${className}`}
  >
    📊 Anyanical Toolkit をTradingViewで見る ↗
  </a>
);

// ダッシュボード本体で使う非プレミアム向けロック画面（共通の訴求文言）。
export const HtfContextPremiumLock = ({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) => (
  <div className="relative min-w-0 overflow-hidden rounded-lg border border-amber-300/20 bg-slate-950 p-6">
    <PremiumLockMark className="absolute right-5 top-5 h-9 w-9" />
    <p className="text-xs font-semibold tracking-[0.22em] text-amber-200">
      ANYANICAL MARKET DASHBOARD
    </p>
    <h3 className="mt-2 max-w-xl pr-12 text-2xl font-bold text-white">
      HTF環境認識ボード
    </h3>
    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
      Anyanical Toolkit の
      AI環境認識（上目線/下目線/レンジ、上下ターゲット）を、MN1/W1/D1/H4の時間足別・カテゴリ別にまとめて確認できます。
    </p>

    <div className="mt-4 max-w-md overflow-hidden rounded-lg border border-white/10">
      <img
        src="/htf-context-sample.png"
        alt="Anyanical Market Dashboardの表示イメージ"
        className="w-full"
      />
    </div>
    <p className="mt-2 max-w-xl text-xs leading-6 text-slate-500">
      Anyanical ToolkitのAI環境認識は、ご自身のTradingViewチャートでも確認できます。
    </p>
    <AnyanicalToolkitLink className="mt-2" />

    <p className="mt-5 text-sm font-semibold text-amber-100">
      この機能はプレミアム限定です
    </p>
    <p className="mt-2 text-sm leading-6 text-slate-400">
      Discordプレミアム会員のみ利用できます。
    </p>
    <div className="mt-5 flex flex-wrap gap-2">
      <a
        href="#/tools/participation"
        className="inline-flex min-h-10 items-center justify-center rounded-full bg-amber-200 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
      >
        プレミアム内容を見る
      </a>
      {!isAuthenticated && (
        <a
          href="#/login"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-indigo-400 px-4 text-sm font-bold text-white transition hover:bg-indigo-300"
        >
          Discordログイン
        </a>
      )}
    </div>
  </div>
);

export const HtfContextBoard = ({
  canAccessPremium,
  isAuthenticated,
}: {
  canAccessPremium: boolean;
  isAuthenticated: boolean;
}) => {
  const auth = useDiscordAuth();
  const { data, isLoading, error, refresh } = useHtfContext(
    auth.session,
    canAccessPremium,
  );
  const favoritesState = useHtfContextFavorites(auth.session, canAccessPremium);
  const { favorites, toggleFavorite } = favoritesState;
  const searchPresets = useHtfContextSearchPresets(auth.session, canAccessPremium);

  const { state: urlState, updateUrlState } = useHtfContextUrlState();

  const [timeframe, setTimeframeRaw] = useState<HtfContextTimeframeId>(urlState.tf);
  const [selectedSymbol, setSelectedSymbolRaw] = useState<string | null>(urlState.symbol);
  const [categoryId, setCategoryIdRaw] = useState<HtfContextCategoryId>(
    urlState.category,
  );
  const [boardFavoriteOnly, setBoardFavoriteOnly] = useState(false);

  const [filters, setFilters] = useState<HtfSearchFilters>(DEFAULT_FILTERS);
  const [selectedPresetId, setSelectedPresetIdRaw] = useState<string | null>(
    urlState.preset,
  );
  const initialPresetAppliedRef = useRef(false);

  // 開閉アニメーションのため、「開いている意思」(showSearch)と「実際にDOM上に存在するか」
  // (isSearchMounted)を分けている。閉じるときはshowSearchだけ先にfalseにして退場アニメーション
  // (animate-slide-up-out)を再生し、アニメーション終了後(onAnimationEnd、または220msのフォールバック
  // タイマー)にアンマウントする。フォールバックはprefers-reduced-motion環境等でアニメーション自体が
  // 発火しない場合や、将来animate-slide-up-outの発火条件が変わった場合にパネルが消えなくなるのを防ぐ。
  const [showSearch, setShowSearch] = useState(urlState.search);
  const [isSearchMounted, setIsSearchMounted] = useState(urlState.search);
  const pendingScrollRef = useRef(false);
  const detailBarRef = useRef<HTMLDivElement>(null);

  const openSearch = () => {
    setIsSearchMounted(true);
    setShowSearch(true);
    updateUrlState({ search: true });
  };

  const scrollToDetailBar = () => {
    const el = detailBarRef.current;
    if (!el) return;
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 意図せず読み上げ位置を奪わないよう、フォーカスは移さずスクロールのみ行う（tabIndex=-1のまま）。
    el.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
    });
  };

  const finishClosingSearch = () => {
    setIsSearchMounted((wasMounted) => {
      if (wasMounted && pendingScrollRef.current) {
        pendingScrollRef.current = false;
        requestAnimationFrame(scrollToDetailBar);
      }
      return false;
    });
  };

  const closeSearch = () => {
    setShowSearch(false);
    updateUrlState({ search: false });
    window.setTimeout(finishClosingSearch, 220);
  };

  const handleSearchPanelAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    // パネル自身（子孫要素ではない）の退場アニメーションが終わったときだけアンマウントする。
    // パネル内部にアニメーション付き要素が増えても、そのイベントがバブリングして退場アニメーションの
    // 再生中に誤ってアンマウントしてしまわないようにするガード。
    if (e.target !== e.currentTarget) return;
    if (e.animationName !== 'slide-up-out') return;
    finishClosingSearch();
  };

  const setSelectedSymbol = (symbol: string | null) => {
    setSelectedSymbolRaw(symbol);
    updateUrlState({ symbol });
  };
  const setTimeframe = (tf: HtfContextTimeframeId) => {
    setTimeframeRaw(tf);
    updateUrlState({ tf });
  };

  // カテゴリを切り替えたとき、選択中の銘柄が新カテゴリに含まれない場合は選択を解除する。
  // そのままにすると、詳細バーは前カテゴリの銘柄・下の一覧表は新カテゴリの銘柄、という
  // 不整合な表示になってしまうため（例: メインでUSDJPYを選択後に仮想通貨へ切り替えた場合）。
  // お気に入り・検索結果からの選択直後にこの関数を呼ぶ場合は、選択銘柄を維持したいカテゴリを
  // 明示的に渡す（getCategoryForSymbolの優先ロジックに委ねる）。
  const handleCategoryChange = (nextCategoryId: HtfContextCategoryId) => {
    setCategoryIdRaw(nextCategoryId);
    updateUrlState({ category: nextCategoryId });
    const nextCategory = HTF_CONTEXT_CATEGORIES.find((c) => c.id === nextCategoryId);
    if (
      nextCategory &&
      selectedSymbol &&
      !nextCategory.symbols.includes(selectedSymbol)
    ) {
      setSelectedSymbol(null);
    }
  };

  const handleBoardSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    const nextCategoryId = getCategoryForSymbol(symbol, categoryId);
    if (nextCategoryId !== categoryId) {
      setCategoryIdRaw(nextCategoryId);
      updateUrlState({ category: nextCategoryId });
    }
  };

  // 検索パネル（おすすめ・検索結果）からの選択は、パネルを閉じてから詳細バーへスクロールする。
  const handleSearchSelect = (symbol: string, tf: HtfContextTimeframeId) => {
    setTimeframe(tf);
    setSelectedSymbol(symbol);
    const nextCategoryId = getCategoryForSymbol(symbol, categoryId);
    setCategoryIdRaw(nextCategoryId);
    updateUrlState({ category: nextCategoryId });
    pendingScrollRef.current = true;
    closeSearch();
  };

  const applyPresetId = (id: string | null) => {
    setSelectedPresetIdRaw(id);
    updateUrlState({ preset: id });
    if (id) {
      const preset = searchPresets.presets.find((p) => p.id === id);
      if (preset) setFilters(preset.filters);
    }
  };

  // ログイン・プレミアム確認後、初回のプリセット取得が終わった時点で1回だけ初期条件を適用する
  // （URLの?preset=を優先、なければユーザーの既定プリセット、どちらもなければ全選択のまま）。
  useEffect(() => {
    if (initialPresetAppliedRef.current) return;
    if (!canAccessPremium) return;
    if (searchPresets.isLoading) return;
    initialPresetAppliedRef.current = true;
    const fromUrl = urlState.preset
      ? searchPresets.presets.find((p) => p.id === urlState.preset)
      : null;
    const fallbackDefault = searchPresets.presets.find((p) => p.isDefault) ?? null;
    const initial = fromUrl ?? fallbackDefault;
    if (initial) {
      setSelectedPresetIdRaw(initial.id);
      setFilters(initial.filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccessPremium, searchPresets.isLoading]);

  const handleCreatePreset = async (name: string) => {
    const created = await searchPresets.createPreset(name, filters);
    if (created) applyPresetId(created.id);
  };
  const handleOverwritePreset = () => {
    if (!selectedPresetId) return;
    void searchPresets.updatePreset(selectedPresetId, { filters });
  };
  const handleRenamePreset = (id: string, name: string) => {
    void searchPresets.updatePreset(id, { name });
  };
  const handleDeletePreset = (id: string) => {
    void searchPresets.deletePreset(id);
    if (id === selectedPresetId) applyPresetId(null);
  };
  const handleResetFilters = () => setFilters(DEFAULT_FILTERS);

  const pineCode =
    HTF_CONTEXT_TIMEFRAMES.find((tf) => tf.id === timeframe)?.pineCode ?? '1D';
  const timeframeLabel =
    HTF_CONTEXT_TIMEFRAMES.find((tf) => tf.id === timeframe)?.label ?? timeframe;

  const rowsBySymbol = useMemo(() => {
    const map = new Map<string, HtfContextState>();
    for (const row of data) {
      if (row.timeframe === pineCode) map.set(row.symbol, row);
    }
    return map;
  }, [data, pineCode]);

  const latestUpdatedAt = useMemo(() => {
    let latest: string | null = null;
    for (const row of rowsBySymbol.values()) {
      if (!latest || row.updatedAt > latest) latest = row.updatedAt;
    }
    return latest;
  }, [rowsBySymbol]);

  const hasAnyData = data.length > 0;
  const searchResults = useMemo(
    () => computeSearchResults(data, filters, HTF_CONTEXT_DIGEST_PRIORITY, favorites),
    [data, filters, favorites],
  );
  const recommendations = useMemo(
    () => computeRecommendations(data, filters),
    [data, filters],
  );

  const selectedPreset =
    searchPresets.presets.find((p) => p.id === selectedPresetId) ?? null;
  const isDefaultFilters = filtersEqual(filters, DEFAULT_FILTERS);
  const saveStatus: SaveStatus = searchPresets.error
    ? 'sync-failed'
    : searchPresets.isMutating
      ? 'saving'
      : selectedPreset
        ? filtersEqual(filters, selectedPreset.filters)
          ? 'saved'
          : 'unsaved'
        : 'applied';

  if (!canAccessPremium) {
    return <HtfContextPremiumLock isAuthenticated={isAuthenticated} />;
  }

  const activeCategory =
    HTF_CONTEXT_CATEGORIES.find((c) => c.id === categoryId) ?? HTF_CONTEXT_CATEGORIES[0];
  const effectiveSelectedSymbol =
    selectedSymbol ?? favorites[0] ?? activeCategory.symbols[0];

  const getCategoryCount = (category: HtfContextCategory): number => {
    if (isDefaultFilters && !boardFavoriteOnly) return category.symbols.length;
    return category.symbols.filter((symbol) => {
      if (boardFavoriteOnly && !favorites.includes(symbol)) return false;
      if (isDefaultFilters) return true;
      const row = rowsBySymbol.get(symbol);
      if (!row) return false;
      if (!filters.states.includes(row.state)) return false;
      const bucket = row.reversalWarning ? 'warning' : 'none';
      if (!filters.reversal.includes(bucket)) return false;
      return true;
    }).length;
  };

  const visibleCategorySymbols = boardFavoriteOnly
    ? activeCategory.symbols.filter((s) => favorites.includes(s))
    : activeCategory.symbols;
  const categoryResults = visibleCategorySymbols.map((symbol) => ({
    symbol,
    timeframeId: timeframe,
    row: rowsBySymbol.get(symbol) ?? null,
  }));

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 max-w-2xl text-sm leading-6 text-slate-400">
          Anyanical
          Toolkit（3.0/3.1）のAI環境認識アラートを反映した参考情報です。裁量判断の材料の一つとしてご利用ください。価格・方向感を保証するものではありません。追加してほしい銘柄・時間足や機能の要望があれば、あにゃまでご連絡ください。
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {latestUpdatedAt && (
            <span className="text-xs text-slate-600">
              最終更新 {formatUpdatedAt(latestUpdatedAt)}
            </span>
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            aria-busy={isLoading}
            className="inline-flex min-h-9 items-center justify-center rounded-full bg-white/[0.04] px-4 text-xs font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10 disabled:opacity-50"
          >
            {isLoading ? '更新中…' : '更新'}
          </button>
          <button
            type="button"
            onClick={() => (showSearch ? closeSearch() : openSearch())}
            aria-expanded={showSearch}
            aria-controls={SEARCH_PANEL_ID}
            className={`inline-flex min-h-9 items-center justify-center gap-1 rounded-full px-4 text-xs font-bold transition ${
              showSearch
                ? 'bg-cyan-300 text-slate-950'
                : 'bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/40 hover:bg-cyan-300/20'
            }`}
          >
            🔍 全時間足から検索
            <span
              className={`inline-block transition-transform duration-200 motion-reduce:transition-none ${showSearch ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              ▼
            </span>
          </button>
        </div>
      </div>

      {!showSearch && (
        <div className="mt-1">
          <HtfContextFilterBadge
            isDefault={isDefaultFilters}
            matchCount={searchResults.length}
            saveStatus={saveStatus}
          />
        </div>
      )}

      {isSearchMounted && (
        <HtfContextSearchSection
          id={SEARCH_PANEL_ID}
          filters={filters}
          onFiltersChange={setFilters}
          matchCount={searchResults.length}
          saveStatus={saveStatus}
          hasAnyData={hasAnyData}
          recommendations={recommendations}
          results={searchResults}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onSelect={handleSearchSelect}
          onClose={closeSearch}
          animationClassName={showSearch ? 'animate-slide-down' : 'animate-slide-up-out'}
          onAnimationEnd={handleSearchPanelAnimationEnd}
          presets={searchPresets.presets}
          selectedPresetId={selectedPresetId}
          isPresetMutating={searchPresets.isMutating}
          presetStatusMessage={searchPresets.statusMessage}
          onApplyPresetId={applyPresetId}
          onCreatePreset={handleCreatePreset}
          onOverwritePreset={handleOverwritePreset}
          onRenamePreset={handleRenamePreset}
          onDeletePreset={handleDeletePreset}
          onSetDefaultPreset={(id) => void searchPresets.setDefaultPreset(id)}
          onRefreshPresets={searchPresets.refresh}
          onResetFilters={handleResetFilters}
          onSelectAllTimeframes={() =>
            setFilters((f) => ({ ...f, timeframes: ALL_TIMEFRAMES }))
          }
          onSelectAllStates={() => setFilters((f) => ({ ...f, states: ALL_STATES }))}
          onSelectAllCategories={() =>
            setFilters((f) => ({ ...f, categories: ALL_CATEGORIES }))
          }
          onSelectAllReversal={() =>
            setFilters((f) => ({ ...f, reversal: ALL_REVERSAL }))
          }
          onClearFavoriteOnly={() => setFilters((f) => ({ ...f, favoriteOnly: false }))}
        />
      )}

      <AnyanicalToolkitLink className="mt-2" />

      {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-bold text-slate-500">表示する時間足</span>
        {HTF_CONTEXT_TIMEFRAMES.map((tf) => (
          <button
            key={tf.id}
            type="button"
            onClick={() => setTimeframe(tf.id)}
            aria-pressed={timeframe === tf.id}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              timeframe === tf.id
                ? 'bg-cyan-300 text-slate-950'
                : 'bg-white/[0.04] text-slate-400 ring-1 ring-white/10 hover:bg-white/10'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {effectiveSelectedSymbol && (
        <HtfContextDetailBar
          symbol={effectiveSelectedSymbol}
          timeframeId={timeframe}
          timeframeLabel={timeframeLabel}
          row={rowsBySymbol.get(effectiveSelectedSymbol)}
          isFavorite={favorites.includes(effectiveSelectedSymbol)}
          onToggleFavorite={toggleFavorite}
          detailBarRef={detailBarRef}
        />
      )}

      <div className="mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-bold text-white">お気に入り</h3>
          <p className="text-xs text-slate-600">
            下の一覧表の☆でお気に入りに追加・削除できます（Discordアカウントに保存され、他の端末でも共有されます）。カードや行をクリックすると上の詳細バーに表示されます
          </p>
        </div>
        {favoritesState.error && (
          <p role="status" className="mt-1 text-xs text-rose-400">
            {favoritesState.error}
            <button
              type="button"
              onClick={favoritesState.retry}
              className="ml-2 font-bold text-cyan-300 hover:text-cyan-200"
            >
              再試行
            </button>
          </p>
        )}
        <span role="status" aria-live="polite" className="sr-only">
          {favoritesState.statusMessage}
        </span>
        {favorites.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            まだお気に入りがありません。下の一覧表の☆マークから追加できます。
          </p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.map((symbol) => (
              <HtfContextSymbolCard
                key={symbol}
                symbol={symbol}
                row={rowsBySymbol.get(symbol)}
                isSelected={symbol === effectiveSelectedSymbol}
                onSelect={handleBoardSelect}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {HTF_CONTEXT_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategoryChange(category.id)}
                aria-pressed={categoryId === category.id}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  categoryId === category.id
                    ? 'bg-amber-200 text-slate-950'
                    : 'bg-white/[0.04] text-slate-400 ring-1 ring-white/10 hover:bg-white/10'
                }`}
              >
                {category.label}
                <span className="ml-1 opacity-70">({getCategoryCount(category)})</span>
              </button>
            ))}
          </div>
          <label className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full bg-white/[0.04] px-3 text-xs font-bold text-slate-400 ring-1 ring-white/10 transition hover:bg-white/10 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-cyan-300">
            <input
              type="checkbox"
              className="h-3.5 w-3.5"
              checked={boardFavoriteOnly}
              onChange={(e) => setBoardFavoriteOnly(e.target.checked)}
            />
            ★ お気に入りのみ
          </label>
        </div>

        <div className="mt-3">
          {boardFavoriteOnly && visibleCategorySymbols.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-slate-950/40">
              <HtfContextEmptyState
                reason="no-favorites"
                actions={[
                  {
                    label: 'お気に入り条件を解除',
                    onClick: () => setBoardFavoriteOnly(false),
                  },
                ]}
              />
            </div>
          ) : (
            <>
              <HtfContextResultsDesktop
                results={categoryResults}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onSelect={(symbol) => handleBoardSelect(symbol)}
              />
              <HtfContextResultsMobile
                results={categoryResults}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onSelect={(symbol) => handleBoardSelect(symbol)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
